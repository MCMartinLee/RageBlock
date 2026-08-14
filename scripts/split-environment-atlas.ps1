param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)

Add-Type -AssemblyName System.Drawing

$names = @(
  "back-lot",
  "arcade-strip",
  "apartment-maze",
  "canal-walk",
  "community-fair",
  "rooftop-relay"
)
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $InputPath).Path)
$destination = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($destination) | Out-Null

try {
  for ($index = 0; $index -lt $names.Count; $index++) {
    $column = $index % 3
    $row = [Math]::Floor($index / 3)
    $sourceRect = New-Object System.Drawing.Rectangle(($column * 512 + 8), ($row * 512 + 82), 496, 279)
    $output = New-Object System.Drawing.Bitmap(496, 279, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($output)
      try {
        $graphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, 496, 279)), $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }
      $path = [System.IO.Path]::Combine($destination, "rageblock-$($names[$index])-background.png")
      $output.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $output.Dispose()
    }
  }
} finally {
  $source.Dispose()
}
