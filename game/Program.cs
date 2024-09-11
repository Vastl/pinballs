using System.Diagnostics;
using System.Text;
using Microsoft.Win32;
class Program
{
    static async Task Main(string[] args) 
    {
        string tempFolder = Path.GetTempPath();
        ExtractAllResources(tempFolder);
        string pinballPath = Path.Combine(tempFolder, "pinball.exe");

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
                // Check if the UUID already exists in the registry
                Guid? userUUID = GetUUIDFromRegistry();

                if (userUUID == null)
                {
                    // If not, generate a new UUID
                    userUUID = Guid.NewGuid();
                    Console.WriteLine("Generated new UUID: " + userUUID.ToString());

                    // Store the new UUID in the registry
                    StoreUUIDInRegistry(userUUID.Value);
                }
                else
                {
                    Console.WriteLine("UUID found: " + userUUID.ToString());
                }
                string? uuid = userUUID.ToString();
                string? username = GetRegistryValue("0.Name");
                string? highScore = GetRegistryValue("0.Score");

                if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(highScore) && !string.IsNullOrEmpty(uuid))
                {
                    Console.WriteLine($"UUID: {uuid}, Username: {username}, High score: {highScore}");
                    await PostHighScoreAsync(uuid, username, highScore);
                }
                else
                {
                    Console.WriteLine("Could not retrieve username or high score.");
                }

                // 3. Close the program after uploading the scores or showing error messages
                Console.WriteLine("See you soon!");
                // Console.WriteLine("Press any key to close the program...");
                // Console.ReadKey();
                // Ensure there's always something to await, even if nothing asynchronous is needed
                await Task.CompletedTask;
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

    static void ExtractAllResources(string outputDir)
    {
        // Get all resource names
        var resourceNames = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceNames();

        foreach (var resourceName in resourceNames)
        {
            // Only extract resources in the "pinball" folder (if needed)
            if (resourceName.StartsWith("game.pinball")) // Adjust based on your project setup
            {
                // Extract the resource to the output directory
                string fileName = resourceName.Replace("game.pinball.", ""); // Remove prefix
                string outputPath = Path.Combine(outputDir, fileName);
                ExtractResource(resourceName, outputPath);
            }
        }

        Console.WriteLine($"Extracted all embedded resources to a temporary directory.");
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
        return null; 
    }

    static async Task PostHighScoreAsync(string userUUID, string username, string highScore)
    {
        string url = "https://scoretodb-ceks756yha-uc.a.run.app";
        string jsonData = "{\"uuid\":\"" + userUUID.ToString() + "\",\"username\":\"" + username + "\",\"high_score\":\"" + highScore + "\"}";


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

    // Store UUID in registry
    static void StoreUUIDInRegistry(Guid userUUID)
    {
        const string registryPath = @"Software\MyApp\";
        using (RegistryKey key = Registry.CurrentUser.CreateSubKey(registryPath))
        {
            key.SetValue("UserUUID", userUUID.ToString());
        }
    }

    // Retrieve UUID from registry
    static Guid? GetUUIDFromRegistry()
    {
        const string registryPath = @"Software\MyApp\";
        using (RegistryKey key = Registry.CurrentUser.OpenSubKey(registryPath))
        {
            if (key != null)
            {
                string? uuidString = key.GetValue("UserUUID") as string;
                if (!string.IsNullOrEmpty(uuidString))
                {
                    return Guid.Parse(uuidString);
                }
            }
        }
        return null;
    }
}