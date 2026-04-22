import pickle
import os

def test_prediction(text):
    nlp_path = "nlp_model.pkl"
    if not os.path.exists(nlp_path):
        print("Model not found.")
        return
        
    with open(nlp_path, "rb") as f:
        data = pickle.load(f)
        model = data["pipeline"]
        
    probs = model.predict_proba([text])[0]
    best_idx = probs.argmax()
    intent = model.classes_[best_idx]
    conf = probs[best_idx]
    
    print(f"Query: {text}")
    print(f"Top Intent: {intent}")
    print(f"Confidence: {conf:.4f}")
    
    # Show top 3
    sorted_idx = probs.argsort()[::-1]
    print("\nTop 3 Intents:")
    for i in range(min(3, len(model.classes_))):
        idx = sorted_idx[i]
        print(f"{i+1}. {model.classes_[idx]} ({probs[idx]:.4f})")

if __name__ == "__main__":
    test_prediction("go to recent updates")
    print("-" * 20)
    test_prediction("goto recent updates")
