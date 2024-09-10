using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Win32;  // Ensure this namespace is available

class Program
{
    static void Main(string[] args)
    {
        // Extract pinball.exe from embedded resources
        string pinballPath = Path.Combine(Path.GetTempPath(), "pinball.exe");
        ExtractResource("YourNamespace.pinball.exe", pinballPath);

        // Run the pinball.exe
        Process pinballProcess = Process.Start(pinballPath);
        pinballProcess.WaitForExit();

        // After Pinball closes, read the high scores
        string username = GetRegistryValue(@"Software\Microsoft\Plus!\Pinball\Space Cadet", "name_0");
        string highScore = GetRegistryValue(@"Software\Microsoft\Plus!\Pinball\Space Cadet", "score_0");

        Console.WriteLine($"Player: {username}, High Score: {highScore}");

        // After Pinball closes, perform any other actions
        Console.WriteLine("Pinball closed. Now processing...");
    }

    static void ExtractResource(string resourceName, string outputPath)
    {
        using (Stream stream = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName))
        using (FileStream fileStream = new FileStream(outputPath, FileMode.Create, FileAccess.Write))
        {
            stream.CopyTo(fileStream);
        }
    }

    static string GetRegistryValue(string registryPath, string keyName)
    {
        try
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(registryPath))
            {
                if (key != null)
                {
                    Object value = key.GetValue(keyName);
                    if (value != null)
                    {
                        return value.ToString();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error reading registry: {ex.Message}");
        }
        return null;
    }
}
