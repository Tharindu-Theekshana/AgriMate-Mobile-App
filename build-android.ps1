param(
    [string]$Task = "assembleRelease",
    [switch]$SingleAbi
)

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
Push-Location "$PSScriptRoot\android"
try {
    if ($SingleAbi) {
        & .\gradlew.bat $Task "-PreactNativeArchitectures=arm64-v8a"
    } else {
        & .\gradlew.bat $Task
    }
} finally {
    Pop-Location
}
