import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
import os

# Define a standard image transformation
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

import numpy as np
from PIL import Image

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=4):
        super(SimpleCNN, self).__init__()
        # 3 input channels (RGB), 16 output channels, 3x3 kernel
        self.conv1 = nn.Conv2d(3, 16, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(16, 32, 3, padding=1)
        
        # 64x64 scaled down by 2 pool layers (2x2) = 16x16
        self.fc1 = nn.Linear(32 * 16 * 16, 128)
        self.fc2 = nn.Linear(128, num_classes)
        
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(-1, 32 * 16 * 16) # Flatten
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def generate_synthetic_image(label):
    # Create 64x64 synthetic patterns
    data = np.zeros((64, 64, 3), dtype=np.uint8)
    
    if label == 0: # Resume: White background + dark lines
        data.fill(255)
        for i in range(10, 60, 5):
            data[i:i+2, 10:54] = [50, 50, 50]
    elif label == 1: # ID Card: Light background + central blob
        data.fill(240)
        # Simple face blob
        data[20:40, 25:39] = [100, 100, 100]
    elif label == 2: # Dashboard: Dark Green background + Bright Green cards
        data[:, :] = [10, 40, 20] # Very dark green
        data[10:30, 20:50] = [30, 180, 100] # Bright card
        data[35:55, 10:30] = [30, 180, 100] # Bright card
    else: # Other: Gaussian noise
        data = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
        
    return transform(Image.fromarray(data))

def train_dummy_cnn(model_path="cnn_model.pth"):
    print("Generating Synthetic Vision Patterns...")
    model = SimpleCNN(num_classes=4)
    
    # Generate 400 patterns (100 per class)
    images = []
    labels = []
    for label in range(4):
        for _ in range(100):
            images.append(generate_synthetic_image(label))
            labels.append(label)
            
    images = torch.stack(images)
    labels = torch.tensor(labels)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("Training CNN on Pattern Data...")
    for epoch in range(10):  # loop over the dataset 10 times for stability
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 2 == 0:
            print(f"Epoch {epoch+1}/10 | Loss: {loss.item():.4f}")

    print("Training complete. Saving weights...")
    torch.save(model.state_dict(), model_path)
    print(f"Model saved to {model_path}!")

if __name__ == "__main__":
    train_dummy_cnn()
