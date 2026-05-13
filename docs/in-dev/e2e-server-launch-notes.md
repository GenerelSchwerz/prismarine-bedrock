# E2E Server Launch Notes

This repo keeps downloaded server software under `.e2e-servers/`, which is gitignored. The setup is intentionally separate from `test/live/` for now: it prepares and launches the server processes, but the live tests still use their existing `HOST`, `PORT`, and `MC_VERSION` environment variables.

## Server Topology

The launcher currently prepares two server families that can run at the same time:

- Java server with Paper, Geyser, and Floodgate as plugins.
- Bedrock Dedicated Server through Endstone.

Default ports:

- Endstone/BDS Bedrock UDP: `19132`, then `19133`, etc. for additional Endstone instances.
- Geyser Bedrock UDP: `19133`, then `19134`, etc. for additional Java/Geyser instances.
- Paper Java TCP: `25565`, then `25566`, etc. for additional Java/Geyser instances.

Use environment variables to change ports:

```powershell
$env:E2E_ENDSTONE_PORT='19132'
$env:E2E_GEYSER_PORT='19133'
$env:E2E_JAVA_PORT='25565'
```

On bash:

```sh
E2E_ENDSTONE_PORT=19132 E2E_GEYSER_PORT=19133 E2E_JAVA_PORT=25565 node scripts/e2e-servers.js launch
```

Multiple instances use separate working directories:

- First Java/Geyser instance: `.e2e-servers/java-geyser/`
- Additional Java/Geyser instances: `.e2e-servers/java-geyser-2/`, `.e2e-servers/java-geyser-3/`, etc.
- First Endstone instance: `.e2e-servers/endstone-bds/`
- Additional Endstone instances: `.e2e-servers/endstone-bds-2/`, `.e2e-servers/endstone-bds-3/`, etc.

## World Generation

Each instance can be configured for `normal` or `superflat` world generation. This currently controls server generation type only; future prefab world support can build on the same instance world profile.

Use one world type for every selected instance:

```powershell
node scripts/e2e-servers.js install --world=superflat
node scripts/e2e-servers.js launch --world=superflat
```

Use separate Java/Geyser world profiles:

```powershell
node scripts/e2e-servers.js install --target=java --java-worlds=normal,superflat
node scripts/e2e-servers.js launch --target=java --java-worlds=normal,superflat
```

Use separate Endstone/BDS world profiles:

```powershell
node scripts/e2e-servers.js install --target=endstone --endstone-worlds=normal,superflat
node scripts/e2e-servers.js launch --target=endstone --endstone-worlds=normal,superflat
```

Environment form:

```powershell
$env:E2E_WORLD='superflat'
$env:E2E_JAVA_WORLDS='normal,superflat'
$env:E2E_ENDSTONE_WORLDS='normal,superflat'
```

The launcher writes distinct world names such as `java-1-normal-paper-26.1.2`, `java-2-superflat-paper-26.1.2`, or `endstone-1-superflat` so switching generation types or Paper versions does not silently reuse an already generated world with a different type/version.

Generated properties:

- Paper normal: `level-type=minecraft:normal`
- Paper superflat: `level-type=minecraft:flat`
- Endstone/BDS normal: `level-type=DEFAULT`
- Endstone/BDS superflat: `level-type=FLAT`

## Cleanup

Cleanup is explicit and only removes generated paths under `.e2e-servers/`.

Clean generated worlds for selected instances:

```powershell
node scripts/e2e-servers.js clean --scope=worlds
node scripts/e2e-servers.js clean --scope=worlds --target=java --java-count=3
node scripts/e2e-servers.js clean --scope=worlds --target=endstone --endstone-count=2
```

Clean e2e run logs:

```powershell
node scripts/e2e-servers.js clean --scope=logs
```

Clean both generated worlds and e2e run logs:

```powershell
node scripts/e2e-servers.js clean --scope=all
```

World cleanup removes generated Java world folders matching e2e naming patterns and generated Endstone worlds/logs. It does not remove downloaded server jars, plugin caches, Endstone virtualenvs, or the Endstone BDS template.

Stop orphaned e2e server processes from crashed or abandoned launcher sessions:

```powershell
node scripts/e2e-servers.js cleanup-orphans
node scripts/e2e-servers.js cleanup-orphans --dry-run
node scripts/e2e-servers.js cleanup-orphans --include-managed
```

Or via package script:

```powershell
pnpm run e2e:servers:cleanup-orphans
```

Orphan cleanup scans local processes for command lines or executable paths under `.e2e-servers/`, skips instances that still have a live `scripts/e2e-servers.js launch` parent, reports those active managed processes with their launcher PID, stops orphaned process trees, and removes stale `.test-lock.<scope>.json` files whose recorded same-host PID is no longer alive. It keeps active test locks. Use `--include-managed` when a launcher-backed server tree is known to be abandoned and should be stopped anyway.

## Install

Run this once to download/install both server families:

```powershell
node scripts/e2e-servers.js install
```

To install one family:

```powershell
node scripts/e2e-servers.js install --target=java
node scripts/e2e-servers.js install --target=endstone
```

To install multiple instances:

```powershell
node scripts/e2e-servers.js install --target=java --java-count=2
node scripts/e2e-servers.js install --target=endstone --endstone-count=2
node scripts/e2e-servers.js install --java-count=2 --endstone-count=2
```

The Java side downloads:

- Paper from the official PaperMC Fill downloads API.
- Geyser Spigot from `https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot`.
- Floodgate Spigot from `https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot`.
- ViaVersion from the latest GitHub release at `ViaVersion/ViaVersion`.

For local bot tests, Geyser defaults to `auth-type: offline` so an offline Bedrock protocol client can join without Xbox/Floodgate account verification. Floodgate is still installed, and the auth type can be changed when needed:

```powershell
$env:E2E_GEYSER_AUTH_TYPE='floodgate'
node scripts/e2e-servers.js install --target=java
```

The generated Geyser config also sets:

```yaml
advanced:
  bedrock:
    validate-bedrock-login: false
```

This is required for the local offline Bedrock protocol bot to connect through Geyser without Bedrock/Xbox login validation.

Every Java/Paper instance writes `ops.json` entries for `OpBot`, `.OpBot`, and the Floodgate all-zero UUID used by local offline Bedrock logins. The plain name covers offline Geyser auth, and the dotted names cover Floodgate-style prefixed Bedrock usernames. Endstone/BDS instances keep `default-player-permission-level=operator`, so local test players are operators by default.

The Java/Paper installer also writes `config/paper-global.yml` with relaxed local e2e spam limits. This keeps command-heavy setup tests from being disconnected by Paper's player packet spam checks while still leaving a high packet limiter in place:

```yaml
packet-limiter:
  all-packets:
    max-packet-rate: 5000.0
spam-limiter:
  incoming-packet-threshold: 10000
  recipe-spam-limit: 10000
  tab-spam-limit: 10000
```

Paper defaults to the newest Paper version exposed by the PaperMC Fill API. Override it with:

```powershell
$env:E2E_PAPER_VERSION='1.21.10'
node scripts/e2e-servers.js install --target=java
```

The newest Paper version may require a newer Java runtime. If Paper exits early with a Java version error, install the required Java version or pin `E2E_PAPER_VERSION` to a server version supported by the local runtime.

To launch Paper with a specific Java executable:

```powershell
$env:E2E_JAVA_BIN='C:\Program Files\Java\jdk-25.0.2\bin\java.exe'
node scripts/e2e-servers.js launch --target=java
```

Command-line form:

```powershell
node scripts/e2e-servers.js launch --target=java --java-bin "C:\Program Files\Java\jdk-25.0.2\bin\java.exe"
```

Use `java.exe` for normal server logging. `javaw.exe` can be selected with the same option, but it is not recommended for this harness because it is designed for GUI/no-console processes and can make stdout/stderr capture unreliable.

ViaVersion is installed into every Java/Paper instance as a normal Bukkit/Paper plugin:

```text
.e2e-servers/java-geyser/plugins/ViaVersion-<version>.jar
```

Downloaded Java plugin artifacts are cached under:

```text
.e2e-servers/cache/java-plugins/
```

## Geyser Extensions And Anti-Cheat

Some Bedrock anti-cheats are Geyser extensions rather than Paper plugins or Endstone plugins. AstroX AntiCheat and Boar are in this category: they run inside Geyser and inspect Bedrock packets before they are translated to Java.

Install AstroX into the Java/Geyser target:

```powershell
node scripts/e2e-servers.js install --target=java --geyser-extension=astrox
```

Install Boar into the Java/Geyser target:

```powershell
node scripts/e2e-servers.js install --target=java --geyser-extension=boar
```

Install both into two Java/Geyser instances:

```powershell
node scripts/e2e-servers.js install --target=java --java-count=2 --geyser-extension=astrox --geyser-extension=boar
```

Equivalent environment form:

```powershell
$env:E2E_GEYSER_EXTENSIONS='astrox,boar'
node scripts/e2e-servers.js install --target=java
```

The extension jar is copied to:

```text
.e2e-servers/java-geyser/plugins/Geyser-Spigot/extensions/
```

For additional Java/Geyser instances, the same extension jars are copied to each instance's `plugins/Geyser-Spigot/extensions/` folder.

Downloaded extension artifacts are cached under:

```text
.e2e-servers/cache/geyser-extensions/
```

The cache is shared across all Java/Geyser instances. Installing an instance copies jars from the cache into that instance's Geyser `extensions/` folder.

Supported extension specs:

- `astrox`: downloads the latest jar from `Eangly99/AstroX-AntiCheat`.
- `boar`: downloads the latest primary jar from Modrinth project `boar`. The local `Boar/` checkout is only for code reference and is not built by this harness.
- `github:owner/repo`: downloads the first `.jar` asset from the latest GitHub release.
- `https://.../file.jar`: downloads a direct jar URL.

Geyser extensions only apply to the Paper/Geyser target. They do not affect the Endstone/BDS target. Native Endstone anti-cheats should be handled separately as Endstone plugins once a plugin package format/source is chosen.

## Java Plugin Profiles

Use Java profiles when you want separate Java/Geyser instances for each anti-cheat configuration:

```powershell
node scripts/e2e-servers.js install --target=java --java-profiles=none,astrox,boar
node scripts/e2e-servers.js launch --target=java --java-profiles=none,astrox,boar
```

This creates three instances:

- `java-1`: no Geyser extensions.
- `java-2`: AstroX only.
- `java-3`: Boar only.

Profiles also support multiple extensions with `+`:

```powershell
node scripts/e2e-servers.js install --target=java --java-profiles=none,astrox,boar,astrox+boar
```

Profile names:

- `none`, `vanilla`, or `base`: no anti-cheat extension.
- `astrox`: AstroX only.
- `boar`: Boar only.
- `astrox+boar`: both extensions.

When `--java-profiles` is used, the Java instance count defaults to the number of profiles. You can still pass `--java-count`; if there are more instances than profiles, profiles repeat. Each install replaces the target instance's `plugins/Geyser-Spigot/extensions/` folder before copying the selected cached jars, so stale plugins do not leak between test runs.

The Endstone side uses `uv` to create `.e2e-servers/endstone-bds/.venv` and install Endstone. The launcher does not manually download Bedrock Dedicated Server. Endstone's own bootstrap downloads or updates BDS in the configured `--server-folder` when the server process starts, using Endstone's supported Minecraft version and remote metadata.

To avoid paying the BDS download/setup cost for every Endstone instance, the launcher warms a reusable Endstone/BDS template under:

```text
.e2e-servers/cache/endstone-template/
```

The template is created by running Endstone once against that cache folder. Instance installs then copy the static BDS and Endstone support files from the template into `.e2e-servers/endstone-bds*`. Mutable folders such as `worlds/` and `logs/` are intentionally not copied, so each instance still creates its own world from its own `server.properties`.

By default, Endstone installs the published `endstone` package through `uv pip`. Pin an older Endstone package when you need the BDS version bundled by that Endstone release:

```powershell
node scripts/e2e-servers.js launch --target=endstone --endstone-package=endstone
```

The launcher records the selected package in the Endstone instance and shared BDS template. If the package spec changes, it rebuilds the generated Endstone instance and template so the existing BDS executable is not silently reused.

To install directly from the GitHub repository instead:

```powershell
$env:E2E_ENDSTONE_PACKAGE='git+https://github.com/EndstoneMC/endstone.git'
node scripts/e2e-servers.js install --target=endstone
```

Installing from GitHub may require local C++ build tools. The package install path is configurable so CI can choose the prebuilt package while investigation machines can test current Endstone source. `uv` must be available on `PATH`.

## Launch

Launch all prepared servers:

```powershell
node scripts/e2e-servers.js launch
```

Launch one family:

```powershell
node scripts/e2e-servers.js launch --target=java
node scripts/e2e-servers.js launch --target=endstone
```

Launch multiple instances:

```powershell
node scripts/e2e-servers.js launch --target=java --java-count=2
node scripts/e2e-servers.js launch --target=endstone --endstone-count=2
node scripts/e2e-servers.js launch --java-count=2 --endstone-count=2
```

The launcher prefixes each process line with the instance name, such as `java-1`, `java-2`, `endstone-1`, or `endstone-2`. Endstone is launched with `--server-folder <instance-dir> --no-confirm --interactive` so it manages BDS in that working directory and keeps a console open for live commands. Press `Ctrl+C` in the launcher terminal to stop all processes it started.

For Endstone packet recording, scope the hook when another Bedrock client may join during a bot run:

```powershell
node scripts/e2e-servers.js launch --target=endstone --world=superflat --endstone-packet-recorder --endstone-packet-recorder-player=OpBot
```

Use `--endstone-packet-recorder-player=NAME` repeatedly, or pass a comma-separated value, to record only selected players. Use `--endstone-packet-recorder-split-by-player` to keep the combined recorder file and also write clean files such as `packet-recorder.OpBot.jsonl` beside it. The environment variables are `E2E_PACKET_RECORDER_PLAYERS` and `E2E_PACKET_RECORDER_SPLIT_BY_PLAYER=1`.

## Structured Logs

Each launcher session creates a directory under `.e2e-servers/runs/<timestamp>/`. This session directory is tied to server uptime, not to a single test run.

Files written for the long-lived server session:

- `server-session.jsonl`: every server process lifecycle event, stdout line, stderr line, and routed stdin command for the whole launcher lifetime.
- `java-1.jsonl`, `java-2.jsonl`, etc.: Paper/Geyser/Floodgate process events and output.
- `endstone-1.jsonl`, `endstone-2.jsonl`, etc.: Endstone/BDS process events and output.
- `commands.jsonl`: commands sent from the launcher console to a server process.

Each client/test run creates a separate directory under:

```text
.e2e-servers/runs/<session-timestamp>/client-runs/<run-id>/
```

Files written per client/test run:

- `combined.jsonl`: the client process events/output plus server output mirrored only while that client run is active.
- `client.jsonl`: client process lifecycle events, stdout, and stderr.
- `java-1.jsonl`, `java-2.jsonl`, etc.: server output during this client run only.
- `endstone-1.jsonl`, `endstone-2.jsonl`, etc.: server output during this client run only.

Each JSONL record includes `ts`, `process`, `kind`, and `event` when it belongs to a process. Output records include `line`; stdin records include `command`.

## Live Server Commands

While `launch` is running, type commands into the launcher terminal:

```text
/client pnpm run test:live
/java say hello from paper
/java-1 say hello from only java instance 1
/endstone say hello from endstone
/endstone-1 say hello from only endstone instance 1
/all list
/quit
```

If only one server target is running, unprefixed input is sent to that server:

```powershell
node scripts/e2e-servers.js launch --target=endstone
```

```text
say hello from endstone
```

When multiple servers are running, commands must be prefixed. `/java` sends to every Java/Geyser instance, `/endstone` sends to every Endstone instance, and `/java-1` or `/endstone-1` sends to a specific instance.

## Capturing A Client Process

Pass a client command with `--client=...` to start one client/test run after the servers launch:

```powershell
node scripts/e2e-servers.js launch --target=endstone --client="pnpm run test:live"
```

The client command can also be passed as the rest of the command line:

```powershell
node scripts/e2e-servers.js launch --target=endstone --client pnpm run test:live
```

For iterative work, keep the launcher open and start new client/test runs from the launcher console:

```text
/client pnpm run test:live
/client pnpm run test:live -- --grep crafting
```

The servers stay up between these runs. Each `/client ...` command creates a new `client-runs/<run-id>/` directory, so test logs are scoped to the test run while server uptime continues uninterrupted.

For a single selected instance, the launcher injects `HOST`, `PORT`, `E2E_SERVER_TARGET`, `E2E_BEDROCK_PLAYER_NAME_PREFIX`, `E2E_BEDROCK_COMMAND_PACKET`, and `E2E_SERVER_COMMAND_FILE` into the client environment. Java/Geyser runs use `.` so command helpers target `.OpBot` and send `command_request`. Endstone/BDS runs use an empty prefix so command helpers target `OpBot` and write setup commands to `E2E_SERVER_COMMAND_FILE`; the launcher forwards that file to the server console because native BDS rejects the current `command_request` shape with `bad_packet`. With multiple selected instances, set the client target explicitly because there is no single unambiguous port.

## Pointing Tests At A Server

The existing live tests read `HOST`, `PORT`, `BOT_USERNAME`, `OFFLINE`, and `MC_VERSION` from `test/helpers/test-env.js`.

For Endstone/BDS:

```powershell
$env:HOST='127.0.0.1'
$env:PORT='19132'
pnpm run test:live
```

For Paper through Geyser:

```powershell
$env:HOST='127.0.0.1'
$env:PORT='19133'
pnpm run test:live
```

The test runner integration should eventually select these targets automatically. Until then, keep launch and test execution as separate steps so packet/debug investigations can choose the server explicitly.

## Notes And Sources

- Geyser's setup guide documents installing Geyser as a plugin on supported Java server software.
- Floodgate's setup guide documents installing Floodgate alongside Geyser for Bedrock players without a Java account.
- GeyserMC's download API redirects the `latest` build download endpoint to the current build artifact.
- Minecraft's Bedrock Dedicated Server download page lists Windows and Ubuntu Linux support and links the official BDS distribution.
- Endstone's GitHub README documents `pip install endstone`, `endstone`, Docker usage, and the optional Linux autoinstaller; this repo uses `uv` to manage the local virtualenv and package install.
