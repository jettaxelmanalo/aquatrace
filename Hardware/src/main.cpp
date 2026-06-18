#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ==========================================
// --- PINS (FULLY MAPPED) ---
// ==========================================
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int TDS_PIN = 34;   
const int ORP_PIN = 35;   

const int RELAY_PUMP_PIN = 25;
const int RELAY_UV_PIN = 26;
const int RELAY_SOLENOID_PIN = 33;

const int AMMONIA_PIN = 32; 
const int SIM_RX_PIN = 16;
const int SIM_TX_PIN = 17;

const int IR_SENSOR_PIN = 15; 
const int WINCH_PIN = 19;     

const int LOADCELL_DOUT_PIN = 4;
const int LOADCELL_SCK_PIN = 2;
const int IN1 = 12;
const int IN2 = 14;
const int IN3 = 13;
const int IN4 = 27;

// ==========================================
// --- THRESHOLDS & MODES ---
// ==========================================
float DISTANCE_THRESHOLD = 18.0; 
float TDS_THRESHOLD = 200.0;     
float ORP_THRESHOLD = 1500.0;    
int AMMONIA_THRESHOLD = 1500;    
float orpOffset = 0.0;

bool autoMode = true; 
bool smsSent = false;           
bool isFeeding = false;         
float currentWeight = 100.0;    
float targetWeight = 0.0;       

// ==========================================
// --- NETWORK SETTINGS ---
// ==========================================
const char* ssid = "Redmi Note 13 Pro 5G";
const char* password = "jettaxel";


const char* mqtt_server = "10.188.181.182"; 
const int mqtt_port = 1883;

const char* mqtt_topic_out = "aquatrace/sensors";
const char* mqtt_topic_in = "aquatrace/sensors/commands";

WiFiClient espClient;
PubSubClient client(espClient);

// ==========================================
// --- RECEIVE COMMANDS ---
// ==========================================
void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  
  Serial.print("\n>>> COMMAND RECEIVED: ");
  Serial.println(msg);

  if (msg == "AUTO_MODE") autoMode = true;
  else if (msg == "MANUAL_MODE") autoMode = false;
  
  else if (msg == "FEED_NOW" && !isFeeding) {
    isFeeding = true;
    targetWeight = currentWeight - 4.0; 
    Serial.println("*** FEEDING SEQUENCE INITIATED ***");
  }

  if (!autoMode) {
    // Relays
    if (msg == "PUMP_ON") digitalWrite(RELAY_PUMP_PIN, HIGH);
    else if (msg == "PUMP_OFF") digitalWrite(RELAY_PUMP_PIN, LOW);
    else if (msg == "UV_ON") digitalWrite(RELAY_UV_PIN, HIGH);
    else if (msg == "UV_OFF") digitalWrite(RELAY_UV_PIN, LOW);
    else if (msg == "SOLENOID_ON") digitalWrite(RELAY_SOLENOID_PIN, HIGH);
    else if (msg == "SOLENOID_OFF") digitalWrite(RELAY_SOLENOID_PIN, LOW);
    
    // Feeder Overrides
    else if (msg == "WINCH_UP") Serial.println("MANUAL: Winch LIFTING hide.");
    else if (msg == "WINCH_DOWN") Serial.println("MANUAL: Winch LOWERING hide.");
    else if (msg == "STEPPER_DISPENSE") {
      currentWeight -= 1.0; 
      Serial.print("MANUAL: Stepper dropping 1g. Hopper Weight: ");
      Serial.print(currentWeight);
      Serial.println("g");
    }
  }
}

// ==========================================
// --- WIFI & MQTT SETUP ---
// ==========================================
void setup_wifi() {
  delay(10);
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("AquaTrace_SingleTank_Client")) {
      Serial.println("connected!");
      client.subscribe(mqtt_topic_in); 
    } else {
      Serial.print("failed, rc="); Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_SOLENOID_PIN, OUTPUT);
  pinMode(RELAY_UV_PIN, OUTPUT); 
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP); 

  digitalWrite(RELAY_PUMP_PIN, LOW);
  digitalWrite(RELAY_SOLENOID_PIN, LOW);
  digitalWrite(RELAY_UV_PIN, LOW);
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop(); 

  // --- 1. READ SENSORS ---
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10); digitalWrite(TRIG_PIN, LOW);
  float distance = (pulseIn(ECHO_PIN, HIGH, 30000) * 0.0343) / 2.0;

  float vTds = analogRead(TDS_PIN) * (3.3 / 4095.0);
  float currentTDS = (133.42 * pow(vTds, 3) - 255.86 * pow(vTds, 2) + 857.39 * vTds) * 0.5;

  float vORP = analogRead(ORP_PIN) * (3.3 / 4095.0);
  float currentORP = ((2.5 - vORP) / 1.037) * 1000.0 + orpOffset;

  int rawAmmonia = analogRead(AMMONIA_PIN);
  float ammoniaVoltage = rawAmmonia * (5.0 / 4095.0);
  int irState = digitalRead(IR_SENSOR_PIN); 

  Serial.println("\n--- TANK STATUS ---");
  Serial.print("Ammonia Raw: "); Serial.print(rawAmmonia);
  Serial.print("  |  Voltage: "); Serial.print(ammoniaVoltage); Serial.println(" V");

  // --- 2. AUTOMATIC RELAY LOGIC ---
  if (autoMode) {
    if (distance > DISTANCE_THRESHOLD && distance != 0) digitalWrite(RELAY_SOLENOID_PIN, HIGH); 
    else digitalWrite(RELAY_SOLENOID_PIN, LOW); 

    if (currentTDS > TDS_THRESHOLD) digitalWrite(RELAY_PUMP_PIN, HIGH);
    else digitalWrite(RELAY_PUMP_PIN, LOW);

    if (currentORP < ORP_THRESHOLD) digitalWrite(RELAY_UV_PIN, HIGH);  
    else digitalWrite(RELAY_UV_PIN, LOW);  
  }

  // --- 3. AMMONIA TO GSM LOGIC ---
  if (rawAmmonia > AMMONIA_THRESHOLD) {
    if (!smsSent) {
      Serial.println("GSM: AT+CMGS=\"+639123456789\" -> WARNING: High Ammonia Detected!");
      smsSent = true; 
    } else {
      Serial.println("GSM: SMS already sent. Waiting for ammonia to drop.");
    }
  } else {
    smsSent = false; 
  }

  // --- 4. FEEDING SEQUENCE ---
  if (isFeeding) {
    if (irState == LOW) Serial.println("Winch: LIFTING HIDE");
    else Serial.println("Winch: HOLDING");

    if (currentWeight > targetWeight) {
      Serial.print("Stepper: SPINNING... Weight: ");
      Serial.print(currentWeight); Serial.println("g");
      currentWeight -= 1.0; 
    } else {
      Serial.println("Stepper: 4G DISPENSED. STOPPING.");
      Serial.println("Winch: LOWERING HIDE.");
      isFeeding = false; 
    }
  }

  // --- 5. SEND LIVE DATA ---
  String jsonPayload = "{";
  jsonPayload += "\"auto_mode\":" + String(autoMode ? "true" : "false") + ",";
  jsonPayload += "\"distance\":" + String(distance) + ",";
  jsonPayload += "\"tds\":" + String(currentTDS) + ",";
  jsonPayload += "\"orp\":" + String(currentORP) + ",";
  jsonPayload += "\"ammonia\":" + String(rawAmmonia) + ",";
  jsonPayload += "\"ir_triggered\":" + String(irState == LOW ? "true" : "false") + ",";
  jsonPayload += "\"weight\":" + String(currentWeight);
  jsonPayload += "}";

  client.publish(mqtt_topic_out, jsonPayload.c_str());
  delay(1000); 
}