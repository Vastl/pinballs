using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;
using Newtonsoft.Json;

class Program
{
    static async Task Main(string[] args)
    {
        // 1. Package and run the pinball game
        string pinballPath = Path.Combine(Directory.GetCurrentDirectory(), "pinnball", "pinball.exe");

        if (File.Exists(pinballPath))
        {
            // Run Pinball and wait for it to exit
            Process pinballProcess = Process.Start(pinballPath);
            Console.WriteLine("Pinball started. Waiting for the game to close...");

            pinballProcess.WaitForExit();  // Wait for the game to close
            Console.WriteLine("Pinball closed.");

            // 2. After Pinball closes, read the high scores
            string username = GetRegistryValue("0.Name");
            string highScore = GetRegistryValue("0.Score");

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(highScore))
            {
                Console.WriteLine($"Username: {username}, High score: {highScore}");
                await PostHighScoreAsync(username, highScore);
            }
            else
            {
                Console.WriteLine("Could not retrieve username or high score.");
            }

            // 3. Close the program after uploading the scores
            Console.WriteLine("Closing program...");
        }
        else
        {
            Console.WriteLine("Pinball executable not found. Make sure 'pinball.exe' is in the same directory.");
        }
    }

    static string GetRegistryValue(string keyName)
    {
        try
        {
            string registryPath = @"Software\Microsoft\Plus!\Pinball\Space Cadet";
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
            Console.WriteLine($"Error accessing the registry: {ex.Message}");
        }
        return null;
    }

    static async Task PostHighScoreAsync(string username, string highScore)
    {
        string url = "https://scoretodb-ceks756yha-uc.a.run.app";
        var data = new { username = username, high_score = highScore };
        string jsonData = JsonConvert.SerializeObject(data);

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
}
