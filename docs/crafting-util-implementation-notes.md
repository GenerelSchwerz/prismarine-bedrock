# Crafting Utility Integration Notes

Future agents should read this file before changing `src/builtins/crafting.js`.

## Current Shape

- The existing Bedrock `item_stack_request` sender remains the authority for executing crafts.
- `mineflayer-crafting-util` is the in-process planner.
- `botState.craftItem()` and `botState.planCraftInventory()` use the utility planner directly. There is no local Bedrock planner fallback.
- `botState.planCraftInventoryWithUtil()` remains as an alias for compatibility.
- `setup.js` owns `botState.bedrockCraftingRecipes` and the `crafting_data` listener. `crafting.js` only consumes the collected live recipes.

## Planner Construction

The utility planner is built once per bot state with `prismarine-recipe(botState.registry).Recipe` and cached on `botState._craftingUtilPlannerPromise`. Keep it tied to the live bot registry instead of constructing a separate `minecraft-data` instance.

## Execution Flow

1. `craftItem()` calls `planCraftInventory()`.
2. The utility planner returns recipe steps, which are simplified before storage on the plan.
3. `craftPlan()` resolves each step just-in-time against live `botState.bedrockCraftingRecipes`.
4. The resolved Bedrock recipe goes through the existing `buildActions()`, `sendRequest()`, and `predictInventory()` path.

This keeps packet construction tied to live Bedrock `crafting_data`, including `recipe_network_id`, `RecipeIngredient`, and `results_deprecated` shapes.

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
