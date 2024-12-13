#include <ESP8266WiFi.h>
#include <Wire.h>
#include <ESP8266HTTPClient.h>

const int sampleInterval = 50;
unsigned int reading;

const char *server = "http://18.210.14.56:5000";

#define SENSOR_PIN A0
#define LED_LOW D3
#define LED_MEDIUM D4
#define LED_HIGH D5

const char ssid[] = "<WIFI_SERVER_NAME>";
const char pass[] = "<WIFI_PASSWORD>";

WiFiClient client;

void setup()
{
   Serial.begin(9600);
   delay(1000);

   // Configure pin modes
   pinMode(SENSOR_PIN, INPUT);
   pinMode(LED_LOW, OUTPUT);
   pinMode(LED_MEDIUM, OUTPUT);
   pinMode(LED_HIGH, OUTPUT);

   // Initialize LEDs to off state
   digitalWrite(LED_LOW, LOW);
   digitalWrite(LED_MEDIUM, LOW);
   digitalWrite(LED_HIGH, LOW);

   // Connect to Wi-Fi
   WiFi.mode(WIFI_STA);
   WiFi.begin(ssid, pass);
   Serial.println("Connecting to Wi-Fi...");

   int retries = 0;
   const int maxRetries = 40;
   while (WiFi.status() != WL_CONNECTED && retries < maxRetries)
   {
      delay(500);
      Serial.print(".");
      retries++;
   }

   if (WiFi.status() != WL_CONNECTED)
   {
      Serial.println("\nFailed to connect to Wi-Fi.");
      return;
   }

   Serial.println("\nConnected to Wi-Fi.");
   Serial.print("IP Address: ");
   Serial.println(WiFi.localIP());

   delay(4000);
}

void loop()
{
   unsigned long startTime = millis(); // Start time of the sampling window
   float amplitude = 0;

   unsigned int maxSignal = 0;
   unsigned int minSignal = 1024;

   // Collect data for the defined interval
   while (millis() - startTime < sampleInterval)
   {
      reading = analogRead(SENSOR_PIN); // get reading from the sensor
      if (reading < 1024)               // Ignore invalid readings
      {
         if (reading > maxSignal)
         {
            maxSignal = reading;
         }
         else if (reading < minSignal)
         {
            minSignal = reading;
         }
      }
   }

   amplitude = maxSignal - minSignal;          // Calculate the peak-to-peak amplitude
   int db = map(amplitude, 20, 900, 49.5, 90); // Map the amplitude to decibel values

   Serial.println(db);

   // Update LED status based on decibel levels
   if (db <= 60)
   {
      digitalWrite(LED_LOW, HIGH);
      digitalWrite(LED_MEDIUM, LOW);
      digitalWrite(LED_HIGH, LOW);
   }
   else if (db > 60 && db < 90)
   {
      digitalWrite(LED_LOW, LOW);
      digitalWrite(LED_MEDIUM, HIGH);
      digitalWrite(LED_HIGH, LOW);
   }
   else if (db >= 90)
   {
      digitalWrite(LED_LOW, LOW);
      digitalWrite(LED_MEDIUM, LOW);
      digitalWrite(LED_HIGH, HIGH);
   }

   // Send decibel data to the server
   String endpoint = String(server) + "/?store=" + db;

   WiFiClient client;
   HTTPClient http;

   http.begin(client, endpoint);
   int httpCode = http.GET();
   if (httpCode > 0)
   {
      String response = http.getString();
   }
   else
   {
      Serial.printf("HTTP GET failed: %s\n", http.errorToString(httpCode).c_str());
   }
   http.end();

   delay(200);
}