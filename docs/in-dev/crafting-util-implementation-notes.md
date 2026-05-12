# Crafting Utility Integration Notes

Future agents should read this file before changing `src/builtins/crafting.js`.

## Current Shape

- The existing Bedrock `item_stack_request` sender remains the authority for executing crafts.
- `mineflayer-crafting-util` is the in-process planner.
- `botState.craftItem()` and `botState.planCraftInventory()` use the utility planner directly. There is no local Bedrock planner fallback.
- `botState.planCraftInventoryWithUtil()` remains as an alias for compatibility.
- `setup.js` owns `botState.bedrockCraftingRecipes` and the `crafting_data` listener. `crafting.js` only consumes the collected live recipes.
- `crafting.js` owns a static recipe registry for utility planning. The live bot registry remains available for runtime item IDs, inventory, and packet execution.

## Planner Construction

The utility planner is built once per bot state and cached on `botState._craftingUtilPlannerPromise`. It must not be built from `botState.registry`, because `setup.js` mutates that registry with live Bedrock runtime item IDs from `item_registry`.

By default, `crafting.js` creates a fresh static `prismarine-registry` for `bedrock_<version>`, builds `prismarine-recipe(staticRegistry).Recipe`, and passes that `Recipe` provider to `mineflayer-crafting-util`. Tests or future integrations can override this with `options.craftingRecipeRegistry`, `options.craftingRegistry`, or `options.craftingRecipe`.

## Execution Flow

1. `craftItem()` calls `planCraftInventory()`.
2. The utility planner returns recipe steps, which are simplified before storage on the plan.
3. `craftPlan()` resolves each step just-in-time against live `botState.bedrockCraftingRecipes`.
4. The resolved Bedrock recipe goes through the existing `buildActions()` and `sendRequest()` path.

This keeps packet construction tied to live Bedrock `crafting_data`, including `recipe_network_id`, `RecipeIngredient`, and `results_deprecated` shapes.

Crafting does not locally predict inventory after sending a craft request. The passive inventory mirror should stay server-authoritative because Geyser can send delayed `inventory_content`/`inventory_slot` updates after accepted craft responses.

For standalone workbench requests, Geyser may accept the craft and send the output slot update without separate source-slot decrements. `crafting.js` should pass the accepted `item_stack_response` and affected slots to the inventory builtin; response-slot reconciliation belongs in `inventory.js`, not in the crafting adapter.

## Runtime IDs vs Planning IDs

Bedrock/Geyser sends live item runtime IDs in `item_registry`. This repo currently loads those into the active registry so inventory packets, raw items, and stack requests use the server's wire IDs.

`mineflayer-crafting-util` and `prismarine-recipe` still expect stable recipe/data IDs from the Prismarine recipe registry. Do not pass live runtime IDs into the planner unless the recipe provider was built from those same runtime IDs. If these ID spaces are mixed, plans can succeed with no recipe steps or look up unrelated items.

The current adapter keeps these concerns separate:

1. Use the static crafting registry item IDs for `mineflayer-crafting-util` planning.
2. Resolve utility steps by item names and recipe names against live `bedrockCraftingRecipes`.
3. Execute with live Bedrock recipe data and server-authoritative inventory stack IDs.

## Utility Step Resolution

Resolution is adapter-owned because `mineflayer-crafting-util` cannot know the server's live Bedrock `crafting_data`, runtime IDs, network IDs, or Geyser behavior.

For utility step outputs, prefer concrete names in this order:

1. `recipe.name` when it maps to a live registry item, for example `minecraft:oak_planks`.
2. `recipe.result.name`, for example `stick`.
3. `recipe.result.id` as a final fallback.

This matters because Bedrock recipe data may use generic group-like names such as `planks` in planner output. The adapter must resolve those against live `crafting_data` and validate the candidate with the current inventory. Inputs such as `minecraft:planks` are handled through the live recipe ingredient/tag path, not by forcing an exact item-name match.

## Known Limitations

- Utility plans are translated by recipe name when possible, otherwise by output item. If a server sends unusual recipe IDs or duplicate outputs, check the resolved recipe before assuming the utility selected recipe is preserved exactly.
- If the utility planner fails, crafting fails at planning time. Do not reintroduce a local Bedrock planner fallback unless the behavior is explicitly requested.
- Keep protocol enum fields as strings and include `dynamic_container_id` in `FullContainerName` slot objects, matching `AGENTS.md`.

## Long-Term Direction

The cleaner long-term solution is upstream-aware live Bedrock recipe support rather than a local registry overwrite.

- `prismarine-registry` should be able to represent both stable data IDs and live Bedrock runtime IDs without losing either mapping. Runtime item IDs are required for packets, but recipe/data IDs are still needed by planners and data-driven APIs.
- `prismarine-recipe` should be able to build a Bedrock recipe provider from server `crafting_data`, including shaped/shapeless inputs, tags such as `planks` and `logs`, outputs, table requirements, and recipe/network IDs.
- `mineflayer-crafting-util` should consume that provider through the same planning interface it uses today, so recursive planning can run against live server recipe data when available.

Once that exists, this repo can stop translating planner steps back to `bedrockCraftingRecipes` by name and instead plan and execute from one coherent live Bedrock recipe model.
