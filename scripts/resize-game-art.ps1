param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][int]$TargetWidth,
  [Parameter(Mandatory = $true)][int]$TargetHeight,
  [int]$SourceX = 0,
  [int]$SourceY = 0,
  [int]$SourceWidth = 0,
  [int]$SourceHeight = 0
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $InputPath).Path)
$sourceWidth = if ($SourceWidth -gt 0) { $SourceWidth } else { $source.Width }
$sourceHeight = if ($SourceHeight -gt 0) { $SourceHeight } else { $source.Height }
$output = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage(
      $source,
      (New-Object System.Drawing.Rectangle(0, 0, $TargetWidth, $TargetHeight)),
      (New-Object System.Drawing.Rectangle($SourceX, $SourceY, $sourceWidth, $sourceHeight)),
      [System.Drawing.GraphicsUnit]::Pixel
    )
  } finally {
    $graphics.Dispose()
  }
  $output.Save([System.IO.Path]::GetFullPath($OutputPath), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $output.Dispose()
  $source.Dispose()
}
