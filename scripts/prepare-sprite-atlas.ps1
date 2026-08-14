param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][int]$Width,
  [Parameter(Mandatory = $true)][int]$Height
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class SpriteAtlasPrep
{
    private static bool IsBackdrop(byte b, byte g, byte r)
    {
        int min = Math.Min(r, Math.Min(g, b));
        int max = Math.Max(r, Math.Max(g, b));
        return min >= 212 && max - min <= 14;
    }

    public static void Run(string inputPath, string outputPath, int width, int height)
    {
        using (var source = new Bitmap(inputPath))
        using (var atlas = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(atlas))
            {
                graphics.DrawImageUnscaled(source, 0, 0);
            }

            var rect = new Rectangle(0, 0, width, height);
            var bits = atlas.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = bits.Stride;
            var pixels = new byte[stride * height];
            Marshal.Copy(bits.Scan0, pixels, 0, pixels.Length);

            var visited = new bool[width * height];
            var queue = new Queue<int>();
            Action<int, int> enqueue = (x, y) => {
                int index = y * width + x;
                int offset = y * stride + x * 4;
                if (!visited[index] && IsBackdrop(pixels[offset], pixels[offset + 1], pixels[offset + 2]))
                {
                    visited[index] = true;
                    queue.Enqueue(index);
                }
            };

            for (int x = 0; x < width; x++)
            {
                enqueue(x, 0);
                enqueue(x, height - 1);
            }
            for (int y = 0; y < height; y++)
            {
                enqueue(0, y);
                enqueue(width - 1, y);
            }

            while (queue.Count > 0)
            {
                int index = queue.Dequeue();
                int x = index % width;
                int y = index / width;
                int offset = y * stride + x * 4;
                pixels[offset + 3] = 0;
                if (x > 0) enqueue(x - 1, y);
                if (x + 1 < width) enqueue(x + 1, y);
                if (y > 0) enqueue(x, y - 1);
                if (y + 1 < height) enqueue(x, y + 1);
            }

            Marshal.Copy(pixels, 0, bits.Scan0, pixels.Length);
            atlas.UnlockBits(bits);
            atlas.Save(outputPath, ImageFormat.Png);
        }
    }
}
"@

[SpriteAtlasPrep]::Run(
  (Resolve-Path -LiteralPath $InputPath).Path,
  [System.IO.Path]::GetFullPath($OutputPath),
  $Width,
  $Height
)
