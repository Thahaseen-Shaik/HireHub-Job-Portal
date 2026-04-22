import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

def train_intent_model(json_path="chat_dataset.json", model_path="nlp_model.pkl"):
    print(f"Loading data from {json_path}...")
    try:
        with open(json_path, "r") as f:
            import json
            data = json.load(f)
            df = pd.DataFrame(data)
    except FileNotFoundError:
        print("JSON dataset not found! Please generate it first.")
        return

    # Extract X (features) and Y (labels)
    X = df['question'].tolist()
    y = df['intent'].tolist()

    # Create a pipeline: TF-IDF Vectorizer -> Logistic Regression Classifier
    nlp_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(lowercase=True, stop_words='english')),
        ('classifier', LogisticRegression(random_state=42))
    ])

    print("Training the NLP model...")
    nlp_pipeline.fit(X, y)

    # Save the pipeline and the answer lookup table
    answer_map = df.drop_duplicates(subset=['intent']).set_index('intent')['answer'].to_dict()
    
    model_data = {
        "pipeline": nlp_pipeline,
        "answer_map": answer_map
    }

    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)
        
    print(f"Model saved successfully to {model_path}!")

if __name__ == "__main__":
    train_intent_model()
