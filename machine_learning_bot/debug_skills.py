import re

def test_regex(text):
    # Improved Skills Detection
    # Case 1: "Add [X] to my skills"
    match = re.search(r'add\s+([a-zA-Z\s\.\#\+,]+?)\s+to\s+(?:my\s+)?skills?', text, re.I)
    if match:
        return [s.strip() for s in re.split(r',|and', match.group(1)) if s.strip()]
    
    # Case 2: "Skills are [X]", "Set skills to [X]"
    match = re.search(r'(?:skills? (?:are|as|is|to)|set my skills? to|proficient in|skills?:)\s+([a-zA-Z\s\.\#\+,]+?)(?=\s+(?:and|my|languages|bio)|$|[\.\,\!])', text, re.I)
    if match:
        return [s.strip() for s in re.split(r',|and', match.group(1)) if s.strip()]
    
    return None

print(f"Test 1 'Add Python and Docker to my skills': {test_regex('Add Python and Docker to my skills')}")
print(f"Test 2 'Add Docker to my skills': {test_regex('Add Docker to my skills')}")
