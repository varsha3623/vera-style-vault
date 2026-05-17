from pymongo import MongoClient

MONGO_URL = "mongodb+srv://vaishnavimathapati30:vera123@cluster0.5dvrx.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URL)

db = client["vera_db"]

wardrobe_collection = db["wardrobe"]

chat_collection = db["chat_history"]

print("MongoDB connected successfully")