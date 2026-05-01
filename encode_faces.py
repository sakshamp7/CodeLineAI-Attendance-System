import face_recognition
import pickle
import os

if not os.path.exists("faces"):
    os.makedirs("faces")
    print("📁 Add images to 'faces' folder and run again.")
    exit()

known_encodings = []
known_names = []

print("Encoding faces...")

for file in os.listdir("faces"):
    if file.endswith((".jpg", ".png", ".jpeg")):
        path = os.path.join("faces", file)
        name = os.path.splitext(file)[0]

        img = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(img)

        if encodings:
            known_encodings.append(encodings[0])
            known_names.append(name)
            print(f"✅ {name}")
        else:
            print(f"❌ No face in {file}")

data = {"encodings": known_encodings, "names": known_names}

with open("encodings.pkl", "wb") as f:
    pickle.dump(data, f)

print("🔥 encodings.pkl created!")