$ErrorActionPreference = "Stop"

$nodePath = "C:\Users\Click Motion\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpm = "C:\Users\Click Motion\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$project = "C:\Users\Click Motion\Documents\Codex\2026-07-15\criar\outputs\bodybuilder"

$env:Path = "$nodePath;$env:Path"
Set-Location $project
& $pnpm dev --hostname 127.0.0.1 --port 3000 *> "$project\preview.log"
