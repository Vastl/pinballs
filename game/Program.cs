using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;
class Program
{
    static async Task Main(string[] args)
    {
        // UPDATED CODE: Extract pinball.exe from embedded resources
        string pinballPath = Path.Combine(Path.GetTempPath(), "pinball.exe");
        ExtractResource("Resources.pinball.exe", pinballPath);

        // Ensure pinball.exe is extracted and exists
        if (File.Exists(pinballPath))
        {
            try
        {
            // Run Pinball and wait for it to exit
            using Process? pinballProcess = Process.Start(pinballPath);
            if (pinballProcess != null)
            {
                Console.WriteLine("Pinball started. Waiting for the game to close...");
                pinballProcess.WaitForExit();  // Wait for the game to close
                Console.WriteLine("Pinball closed.");
            }
            else
            {
                Console.WriteLine("Failed to start Pinball process.");
                return;
            }

            // 2. After Pinball closes, read the high scores (Windows platform only)
        #if WINDOWS
            string? username = GetRegistryValue("0.Name");
            string? highScore = GetRegistryValue("0.Score");

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(highScore))
            {
                Console.WriteLine($"Username: {username}, High score: {highScore}");
                await PostHighScoreAsync(username, highScore);
            }
            else
            {
                Console.WriteLine("Could not retrieve username or high score.");
            }
            #else
            Console.WriteLine("Registry access is not supported on this platform.");
        #endif

            // 3. Close the program after uploading the scores
            Console.WriteLine("Closing program...");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while running the program: {ex.Message}");
        }
    }
    else
    {
        Console.WriteLine("Pinball executable not found. Make sure 'pinball.exe' is in the same directory.");
    }
    // Ensure there's always something to await, even if nothing asynchronous is needed
    await Task.CompletedTask;
}

    static void ExtractResource(string resourceName, string outputPath)
    {
        try
        {
            // Get the stream for the embedded resource
            using Stream? stream = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                Console.WriteLine("Resource not found: " + resourceName);
                return;
            }
            // Create the output file stream and copy the resource content to it
            using FileStream fileStream = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
            stream.CopyTo(fileStream);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error extracting resource: {ex.Message}");
        }
    }
}

#if WINDOWS
    static string? GetRegistryValue(string keyName)
    {
        try
        {
            string registryPath = @"Software\\Microsoft\\Plus!\\Pinball\\SpaceCadet";
            using (RegistryKey? key = Registry.CurrentUser.OpenSubKey(registryPath)) // Make the key nullable
            {
                if (key != null)
                {
                    Object? value = key.GetValue(keyName); // Handle the value as nullable
                    if (value != null)
                    {
                        return value.ToString();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error accessing the registry: {ex.Message}");
        }
        return null; // Ensure a nullable return type
    }

    static async Task PostHighScoreAsync(string username, string highScore)
    {
        string url = "https://scoretodb-ceks756yha-uc.a.run.app";
        string jsonData = "{\"username\":\"" + username + "\",\"high_score\":\"" + highScore + "\"}";

        using (HttpClient client = new HttpClient())
        {
            try
            {
                var content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                HttpResponseMessage response = await client.PostAsync(url, content);

                response.EnsureSuccessStatusCode();
                string responseText = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"High score posted successfully: {responseText}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to post high score: {ex.Message}");
            }
        }
    }
#endif