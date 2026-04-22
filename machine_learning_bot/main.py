from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import os
import json
import difflib
import re
from PIL import Image
import io

app = FastAPI(title="Academic ML Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
nlp_model = None
answer_map = {}
vision_model = None
fallback_dataset = {}

# Reinforcement Learning Memory
learned_responses = {} # Map of "query": "intent"
LEARNED_DATA_PATH = "learned_responses.json"

def load_models():
    global nlp_model, answer_map, vision_model, learned_responses
    
    # Load NLP Model Fallback
    global fallback_dataset
    dataset_path = "chat_dataset.json"
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            fallback_dataset = json.load(f)
            # Create answer map
            for intent, ans in zip(fallback_dataset["intent"], fallback_dataset["answer"]):
                if intent not in answer_map:
                    answer_map[intent] = ans
            print("Fallback NLP Matcher loaded.")
    else:
        print("Warning: chat_dataset.json not found!")

    # Load Vision Model
    cnn_path = "cnn_model.pth"
    vision_model = None
    """
    vision_model = SimpleCNN(num_classes=4)
    if os.path.exists(cnn_path):
        vision_model.load_state_dict(torch.load(cnn_path, map_location=torch.device('cpu')))
        vision_model.eval()
        print("Vision Model loaded.")
    else:
        print("Warning: Vision model not found. Using untrained weights.")
    """

    # Load Learned Memory
    if os.path.exists(LEARNED_DATA_PATH):
        try:
            with open(LEARNED_DATA_PATH, "r") as f:
                learned_responses = json.load(f)
                print(f"Loaded {len(learned_responses)} learned responses.")
        except:
            learned_responses = {}

def save_learned_responses():
    with open(LEARNED_DATA_PATH, "w") as f:
        json.dump(learned_responses, f, indent=4)

class ChatRequest(BaseModel):
    message: str
    role: str = "visitor"

class FeedbackRequest(BaseModel):
    message: str
    intent: str
    is_helpful: bool
    correction: str = None

@app.on_event("startup")
async def startup_event():
    load_models()

# Role-Based Intent Mapping
ROLE_FILTER = {
    "visitor": ["greeting", "working_hours", "process", "farewell", "login", "register", "forgot_password", "explore_jobs", "companies", "contact", "about", "change_theme", "terms_conditions", "visitor_monitor_nav"],
    "user": ["greeting", "working_hours", "process", "farewell", "apply_job", "explore_jobs", "interviews", "companies", "contact", "about", "change_theme", "forgot_password", "terms_conditions", "user_update_profile",
             "user_home_nav", "user_jobs_nav", "user_resume_nav", "user_interviews_nav", "user_profile_nav", "user_assessments_nav", "user_events_nav", "user_help_nav", "image_query_followup"],
    "manager": ["greeting", "working_hours", "farewell", "manager_jobs", "manager_applications", "manager_interviews", "manager_confirm_action", "image_query_followup", "change_theme", "terms_conditions", "manager_create_job", "user_update_profile",
                "manager_overview_nav", "manager_profile_nav", "manager_users_nav", "manager_tests_nav", "manager_offboarding_nav", "manager_recent_nav", "manager_monitor_nav",
                "admin_dashboard_nav", "admin_users_nav", "admin_companies_nav", "admin_logs_nav", "admin_settings_nav",
                "user_home_nav", "user_jobs_nav", "user_resume_nav", "user_interviews_nav", "user_profile_nav"],
    "admin": ["greeting", "working_hours", "farewell", "admin_users", "admin_companies", "admin_logs", "change_theme", "terms_conditions", "admin_monitor_nav", "manager_create_job", "user_update_profile",
              "admin_dashboard_nav", "admin_users_nav", "admin_companies_nav", "admin_logs_nav", "admin_settings_nav", "admin_applications_nav", "admin_subscriptions_nav", "image_query_followup"]
}

def extract_entities(text: str):
    import re
    entities = {
        "email": None, 
        "time_info": None,
        "fullName": None,
        "phone": None,
        "bio": None,
        "department": None,
        "jobTitle": None,
        "requirements": None,
        "location": None,
        "currentLocation": None,
        "preferredLocation": None,
        "headline": None,
        "displayName": None,
        "gender": None,
        "dob": None,
        "skills": None,
        "skills_append": False,
        "languages": None,
        "languages_append": False,
        "education": None,
        "experience": None,
        "internship": None,
        "project": None,
        "extraCurricular": None,
        "certification": None,
        "resumeUrl": None,
        "interviewType": None
    }
    
    text_lower = text.lower()
    
    # Extract Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        entities["email"] = email_match.group(0)
    
    # Resume URL
    resume_match = re.search(r'(?:resume link|resume url|cv link|cv url|online resume|link to my resume|link to my cv)\s+(?:to|is|as)\s+[\'"]?(https?://[^\s\'"]+)[\'"]?', text, re.I)
    if resume_match:
        entities["resumeUrl"] = resume_match.group(1).strip()

    # Profile Name Detection (e.g. "my name is Sarah", "call me Sarah", "change my name to Moksha", "update name as Moksha")
    name_match = re.search(r'(?:name is|call me|updated? to|change my name to|set name to|name as|name is|update name as)\s+([a-zA-Z\s]+?)(?=\s+(?:and|my|bio|phone|email|dept|department|to|is)|$|[\.\,\!])', text, re.I)
    if name_match:
        name = name_match.group(1).strip()
        if len(name.split()) <= 4: # sanity check
            entities["fullName"] = name

    # Department Detection
    dept_match = re.search(r'(?:department to|dept as|working in|change department to|set dept to|department as|department is|set department to)\s+([a-zA-Z\s]+?)(?=\s+(?:and|my|bio|phone|email|name|call)|$|[\.\,\!])', text, re.I)
    if dept_match:
        entities["department"] = dept_match.group(1).strip()

    # Phone Number Detection (Supports 10-digit solid, spaces, dashes, international)
    phone_match = re.search(r'(\+?\d{1,4}?[\s-]?\(?\d{2,4}?\)?[\s-]?\d{3,4}[\s-]?\d{3,6}|\b\d{10}\b)', text)
    if phone_match:
        entities["phone"] = phone_match.group(0)

    # Bio Snippet (e.g. "bio to 'i am a dev'")
    bio_match = re.search(r'(?:bio to|describe me as|about me as|bio as)\s+[\'"]?([^\'"]+)[\'"]?', text, re.I)
    if bio_match:
        entities["bio"] = bio_match.group(1).strip()

    # Job Title Detection (e.g. "hire a react developer", "add job title as Java Developer")
    job_match = re.search(r'(?:hire|post a?|need a?|opening for a?|add job title as)\s+([a-zA-Z\s\.\#\+]+?)(?:\s+in|\s*[\.\,]|for|description|$)', text, re.I)
    if job_match:
        entities["jobTitle"] = job_match.group(1).strip()

    # Generic Requirements extractor
    req_match = re.search(r'(?:requirements as|desc as|description to|details are)\s+[\'"]?([^\'"]+)[\'"]?', text, re.I)
    if req_match:
        entities["requirements"] = req_match.group(1).strip()

    # Headline & Display Name
    headline_match = re.search(r'(?:headline as|headline is|professional headline is|headline to)\s+[\'"]?([^\'"]+)[\'"]?', text, re.I)
    if headline_match:
        entities["headline"] = headline_match.group(1).strip()

    disp_name_match = re.search(r'(?:display name as|show my name as|nickname as)\s+([a-zA-Z\s]+?)(?=\s+(?:and|my|headline|bio)|$|[\.\,\!])', text, re.I)
    if disp_name_match:
        entities["displayName"] = disp_name_match.group(1).strip()

    # Location Detection
    curr_loc_match = re.search(r'(?:living in|at|current location is|currently at|living at)\s+([a-zA-Z\s,]+?)(?=\s+(?:and|my|to|want|preferred)|$|[\.\,\!])', text, re.I)
    if curr_loc_match:
        entities["currentLocation"] = curr_loc_match.group(1).strip()
    
    pref_loc_match = re.search(r'(?:preferred location to|want to work in|looking for jobs in|fav location as|preferred location as)\s+([a-zA-Z\s,]+?)(?=\s+(?:and|my|current)|$|[\.\,\!])', text, re.I)
    if pref_loc_match:
        entities["preferredLocation"] = pref_loc_match.group(1).strip()

    # Skills Detection (Supports both "Add X to my skills" and "Skills are X")
    skills_add_match = re.search(r'add\s+([a-zA-Z\s\.\#\+,]+?)\s+to\s+(?:my\s+)?skills?', text, re.I)
    if skills_add_match:
        entities["skills"] = [s.strip() for s in re.split(r',|and', skills_add_match.group(1)) if s.strip()]
        entities["skills_append"] = True
    else:
        skills_match = re.search(r'(?:skills? (?:are|as|to|is)|set my skills? to|proficient in|skills?:)\s+([a-zA-Z\s\.\#\+,]+?)(?=\s+(?:and|my|languages|bio)|$|[\.\,\!])', text, re.I)
        if skills_match:
            entities["skills"] = [s.strip() for s in re.split(r',|and', skills_match.group(1)) if s.strip()]

    # Languages Detection (Supports "Add X to my languages" and "Can speak X")
    langs_add_match = re.search(r'add\s+([a-zA-Z\s,]+?)\s+to\s+(?:my\s+)?languages?', text, re.I)
    if langs_add_match:
        entities["languages"] = [l.strip() for l in re.split(r',|and', langs_add_match.group(1)) if l.strip()]
        entities["languages_append"] = True
    else:
        langs_match = re.search(r'(?:languages? (?:are|as|is|to)|set my languages? to|can speak|languages?:)\s+([a-zA-Z\s,]+?)(?=\s+(?:and|my|skills|bio)|$|[\.\,\!])', text, re.I)
        if langs_match:
            entities["languages"] = [l.strip() for l in re.split(r',|and', langs_match.group(1)) if l.strip()]

    # Gender & DOB
    gender_match = re.search(r'(?:my gender is|gender as|set gender to)\s+(male|female|other)', text, re.I)
    if gender_match:
        entities["gender"] = gender_match.group(1).lower()

    dob_match = re.search(r'(?:born on|date of birth is|dob is)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})', text, re.I)
    if dob_match:
        entities["dob"] = dob_match.group(1)
    
    # Education: "Add education: [Degree] at [University]"
    edu_match = re.search(r'(?:add education|education as|studied)\s+([a-zA-Z\s]+?)\s+at\s+([a-zA-Z\s,]+)', text, re.I)
    if edu_match:
        entities["education"] = {"degree": edu_match.group(1).strip(), "institution": edu_match.group(2).strip()}

    # Experience: "Add experience: [Role] at [Company]"
    exp_match = re.search(r'(?:add experience|experience as|worked as)\s+([a-zA-Z\s]+?)\s+at\s+([a-zA-Z\s,]+)', text, re.I)
    if exp_match:
        entities["experience"] = {"role": exp_match.group(1).strip(), "company": exp_match.group(2).strip()}

    # Internship
    intern_match = re.search(r'(?:add internship|interned as)\s+([a-zA-Z\s]+?)\s+at\s+([a-zA-Z\s,]+)', text, re.I)
    if intern_match:
        entities["internship"] = {"role": intern_match.group(1).strip(), "company": intern_match.group(2).strip()}

    # Projects: "Add project: [Title] with description [Desc]"
    proj_match = re.search(r'(?:add project|project is)\s+([^\-:]+)(?:[\-:]\s*|\s+(?:with description|desc as)\s+)(.+)', text, re.I)
    if proj_match:
        entities["project"] = {"title": proj_match.group(1).strip(), "description": proj_match.group(2).strip()}

    # Extra Curriculars
    extra_match = re.search(r'(?:add|set)\s+([a-zA-Z\s,]+?)\s+to\s+(?:my\s+)?(?:extra\s+curriculars?|activities)', text, re.I)
    if extra_match:
        entities["extraCurricular"] = [s.strip() for s in re.split(r',|and', extra_match.group(1)) if s.strip()]

    # Accomplishments (Certifications)
    cert_match = re.search(r'(?:add|got)\s+certification\s+([a-zA-Z\s0-9\.\#\+]+?)(?:\s+from|$|[\.\,\!])', text, re.I)
    if cert_match:
        entities["certification"] = cert_match.group(1).strip()
    time_keywords = ["tomorrow", "today", "pm", "am", "monday", "tuesday", "wednesday", "thursday", "friday", "at",
                     "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
                     "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    found_keywords = [word for word in time_keywords if word in text_lower]
    
    # Catch "19 April", "April 19th", etc.
    date_patterns = [
        r'\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*',
        r'(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text_lower)
        if match:
            found_keywords.append(match.group(0))

    digit_match = re.search(r'\d{1,2}[:.]\d{2}', text)
    if digit_match:
        found_keywords.append(digit_match.group(0))
    elif re.search(r'\d{1,2}\s?(pm|am)', text_lower):
        time_only = re.search(r'\d{1,2}\s?(pm|am)', text_lower).group(0)
        found_keywords.append(time_only)

    if found_keywords:
        entities["time_info"] = " ".join(found_keywords)
        
    # Interview Type Detection (e.g. "technical interview", "hr call")
    type_match = re.search(r'(technical|hr|cultural|behavioral|coding|system design)\s+(?:interview|call|round)', text, re.I)
    if type_match:
        entities["interviewType"] = type_match.group(1).capitalize()
    elif "interview" in text_lower:
        if "hr" in text_lower: entities["interviewType"] = "HR"
        elif "tech" in text_lower: entities["interviewType"] = "Technical"

    return entities

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    query = req.message.lower().strip()
    role = req.role.lower()
    entities = extract_entities(req.message)
    
    # PRIORITY: Force autonomous actions if specific keywords are present
    if (role == "manager" or role == "admin") and re.search(r'(?:add job title|create job|post a? job)', query, re.I):
        best_intent = "manager_create_job"
        best_prob = 1.0
        print(f"DEBUG: Forced intent {best_intent} due to priority keyword")
    else:
        # 1. Check Learned Memory (Fuzzy)
        best_intent = "unknown"
        best_prob = 0.0
        
        if learned_responses:
            # Exact match
            if query in learned_responses:
                intent = learned_responses[query]
                
                # Handle direct Custom Answers provided by users
                if intent.startswith("CUSTOM_REPLY|"):
                    return {
                        "intent": "custom_user_answer",
                        "reply": intent.split("CUSTOM_REPLY|")[1],
                        "needs_feedback": True,
                        "source": "learned_memory",
                        "action": None
                    }

                # Standard intent routing
                # Verify if intent is allowed for this role
                if intent in ROLE_FILTER.get(role, []):
                    action = None
                    if intent == "manager_interviews": action = "OPEN_INTERVIEWS"
                    elif intent == "manager_confirm_action": action = "CONFIRM_SCHEDULE"
                    
                    return {
                        "intent": intent,
                        "reply": answer_map.get(intent, "I learned this!"),
                        "needs_feedback": True,
                        "source": "learned_memory",
                        "action": action
                    }
            
            # Fuzzy match
            matches = difflib.get_close_matches(query, learned_responses.keys(), n=1, cutoff=0.8)
            if matches:
                intent = learned_responses[matches[0]]
                if intent in ROLE_FILTER.get(role, []):
                    best_intent = intent
                    best_prob = 0.95
                    print(f"DEBUG: Selected intent {best_intent} from learned memory")

    # 2. NLP Phase: Special Filtering logic
    allowed_intents = ROLE_FILTER.get(role, [])
    
    # Fallback to simple matching only if intent is still unknown
    if best_intent == "unknown":
        query_tokens = set(query.split())
        if "fallback_dataset" in globals():
            for intent, question in zip(fallback_dataset["intent"], fallback_dataset["question"]):
                # ONLY consider intents allowed for this role
                if intent not in allowed_intents:
                    continue
                    
                q_tokens = set(question.lower().split())
                overlap = len(query_tokens.intersection(q_tokens)) / (len(q_tokens) + 0.1)
                
                # Boost manager_create_job if hiring keywords are present
                if intent == "manager_create_job" and any(k in query for k in ["hire", "post", "add job", "requirements"]):
                    overlap += 0.3
                    
                if overlap > best_prob:
                    best_prob = overlap
                    best_intent = intent
                    if best_prob > 0.9: break # Fast early exit
    
    # AGENTIC FORCE: If we found specific Job or Profile entities, override the generic intent
    if role == "manager" or role == "admin":
        if entities.get("jobTitle") or entities.get("requirements"):
            best_intent = "manager_create_job"
            best_prob = 1.0
    profile_fields = ["fullName", "phone", "bio", "department", "skills", "languages", "languages_append", "headline", "currentLocation", "preferredLocation", "displayName", "gender", "dob", "education", "experience", "internship", "project", "extraCurricular", "certification", "resumeUrl"]
    if any(entities.get(f) for f in profile_fields):
        # Profile updates should override generic or navigational intents if profile entities are present
        nav_and_generic = ["change_theme", "unknown", "greeting", "user_home_nav", "user_profile_nav", "user_jobs_nav", "manager_overview_nav"]
        if best_intent in nav_and_generic:
            best_intent = "user_update_profile"
            best_prob = 1.0
        elif best_intent not in ["manager_create_job", "manager_applications", "manager_interviews"]: 
            # Default to profile update if it doesn't conflict with high-priority manager actions
            best_intent = "user_update_profile"
            best_prob = 1.0
    
    # Threshold checks for the role-filtered best intent
    if best_prob < 0.15:
        return {
            "intent": "unknown",
            "reply": f"I'm your {role} assistant. I focus only on {role} tasks like {', '.join(allowed_intents[:3])}. Could you clarify how I can help?",
            "needs_feedback": True,
            "confidence": best_prob
        }
    
    action = None
    payload = None

    if best_intent == "manager_interviews": 
        action = "OPEN_INTERVIEWS"
    elif best_intent == "manager_confirm_action": 
        action = "CONFIRM_SCHEDULE"
    elif best_intent == "manager_applications":
        action = "NAVIGATE_SECTION"
        payload = {"section": "applications"}
    elif best_intent == "manager_jobs" or best_intent == "manager_job_nav":
        action = "NAVIGATE_SECTION"
        payload = {"section": "jobs"}
    elif best_intent == "admin_monitor_nav":
        action = "NAVIGATE_URL"
        payload = {"url": "/admin/dashboard"}
    elif best_intent == "visitor_monitor_nav":
        action = "NAVIGATE_URL"
        payload = {"url": "/user/home"} # Visitors see public feed on user home fallback
    elif best_intent == "manager_monitor_nav":
        action = "NAVIGATE_SECTION"
        payload = {"section": "overview"}
    elif best_intent == "manager_create_job":
        action = "CREATE_JOB"
        # Combine fragments into description if title isn't enough
        title = (entities.get("jobTitle") or "New Opening").title()
        desc = entities.get("requirements") or f"Automatically generated opening for {title}"
        payload = {"title": title, "description": desc, "location": entities.get("location")}
    elif best_intent == "user_update_profile":
        action = "UPDATE_PROFILE"
        exclude_keys = ["time_info", "jobTitle", "requirements", "location", "interviewType"]
        payload = {k: v for k, v in entities.items() if k not in exclude_keys and v is not None}
    
    # Manager Dashboard Multi-Section Mapping
    dashboard_section_map = {
        "manager_overview_nav": "overview",
        "manager_profile_nav": "profile",
        "manager_users_nav": "userManagement",
        "manager_tests_nav": "test-links",
        "manager_offboarding_nav": "offboardingLetters",
        "manager_recent_nav": "updates"
    }
    
    if best_intent in dashboard_section_map:
        action = "NAVIGATE_SECTION"
        payload = {"section": dashboard_section_map[best_intent]}
    
    # Theme Switching Logic
    if best_intent == "change_theme":
        action = "CHANGE_THEME"
        msg = req.message.lower()
        if "arctic" in msg or "blue" in msg:
            payload = {"theme": "arctic"}
        elif "ember" in msg or "orange" in msg:
            payload = {"theme": "ember"}
        elif "forest" in msg or "green" in msg or "emerald" in msg:
            payload = {"theme": "forest"}
        else:
            payload = {"theme": "default"}
    
    # Global Navigation Mapping (External URLs)
    nav_map = {
        "admin_dashboard_nav": "/admin/dashboard",
        "admin_users_nav": "/admin/users",
        "admin_companies_nav": "/admin/companies",
        "admin_logs_nav": "/admin/logs",
        "admin_settings_nav": "/admin/settings",
        "admin_applications_nav": "/admin/applications",
        "admin_subscriptions_nav": "/admin/subscriptions",
        "user_home_nav": "/user/home",
        "user_jobs_nav": "/user/job-profiles",
        "user_resume_nav": "/user/resume",
        "user_interviews_nav": "/user/interviews",
        "user_profile_nav": "/user/my-profile",
        "user_assessments_nav": "/user/assessments",
        "user_events_nav": "/user/events",
        "user_help_nav": "/user/help"
    }

    if best_intent in nav_map:
        action = "NAVIGATE_URL"
        payload = {"url": nav_map[best_intent]}
    
    if best_intent == "image_query_followup":
        answer = "I'm looking at the last image you shared. Based on my visual scan, I can help you interpret what's on screen or guide you through that specific section. What part of the image can I help with?"
    else:
        answer = answer_map.get(best_intent, "I cannot fulfill this request.")
    
    # Add a personal touch if it's the manager assistant
    if role == "manager" and best_intent == "manager_interviews":
        confirm_text = ""
        if entities["email"]: confirm_text += f" for {entities['email']}"
        if entities["time_info"]: confirm_text += f" at {entities['time_info']}"
        answer = f"Sure! I'm opening the interview scheduler{confirm_text}. " + answer

    return {
        "intent": best_intent,
        "reply": answer,
        "needs_feedback": False,
        "confidence": best_prob,
        "action": action,
        "entities": entities,
        "payload": payload
    }

@app.post("/feedback")
async def feedback_endpoint(req: FeedbackRequest):
    query = req.message.lower().strip()

    if not req.is_helpful:
        # If the user provided a custom answer text, learn it exactly as they typed it!
        if req.correction and req.correction.strip():
            custom_answer = req.correction.strip()
            learned_responses[query] = f"CUSTOM_REPLY|{custom_answer}"
            save_learned_responses()
            return {"status": "success", "message": f"Saved custom answer for '{query}'"}

        # Actually unlearn the mistake if it was formally learned!
        if query in learned_responses:
            del learned_responses[query]
            save_learned_responses()
            return {"status": "success", "message": f"Unlearned bad response for '{query}'"}
        return {"status": "success", "message": "Feedback noted."}

    # If helpful, we "Learn" the association
    if query and req.intent != "unknown":
        learned_responses[query] = req.intent
        save_learned_responses()
        return {"status": "success", "message": f"Successfully learned: '{query}' belongs to '{req.intent}'"}
    
    return {"status": "success", "message": "Feedback recorded."}

def classify_image_heuristic(image):
    """
    Lightweight PIL-only image classifier — no PyTorch required.
    Classes: Resume | ID Card | Dashboard Screenshot | Unknown/Other
    
    Heuristics:
      Resume       → very bright/white bg + high dark-pixel text ratio
      ID Card      → light bg + moderate dark region + small/portrait aspect
      Dashboard    → dark or saturated background + vivid accent colors
      Unknown      → fallback
    """
    import numpy as np

    img_small = image.resize((128, 128), Image.NEAREST)  # NEAREST preserves exact pixel values
    pixels = list(img_small.getdata())  # list of (R, G, B)

    total = len(pixels)
    r_vals = [p[0] for p in pixels]
    g_vals = [p[1] for p in pixels]
    b_vals = [p[2] for p in pixels]

    avg_brightness = (sum(r_vals) + sum(g_vals) + sum(b_vals)) / (3 * total)

    # Dark pixels (text-like): luminance < 120 (catches grey text & blobs too)
    dark_ratio = sum(1 for p in pixels if (p[0] + p[1] + p[2]) / 3 < 120) / total

    # Very bright pixels (white paper bg): luminance > 200
    bright_ratio = sum(1 for p in pixels if (p[0] + p[1] + p[2]) / 3 > 200) / total

    # Colorful/saturated pixels: max_channel - min_channel > 60
    saturated_ratio = sum(
        1 for p in pixels if (max(p) - min(p)) > 60
    ) / total

    width, height = image.size
    aspect = width / max(height, 1)

    # --- Classification rules (order matters — most specific first) ---

    # Dashboard: dark bg OR vivid saturated colors (check first — clearest signal)
    if avg_brightness < 130 or saturated_ratio > 0.20:
        return "Dashboard Screenshot"

    # Resume: white/light bg + clear dark TEXT (high dark_ratio = lots of text lines)
    #   dark_ratio > 0.08 means plenty of text, not just one blob
    if bright_ratio > 0.45 and dark_ratio > 0.08:
        return "Resume"

    # ID Card: light bg + small-to-moderate dark region (face/photo blob)
    #   dark_ratio is low-to-moderate (just a blob, not dense text)
    if bright_ratio > 0.35 and 0.01 < dark_ratio <= 0.08:
        return "ID Card"

    # Resume fallback: lighter text coverage
    if bright_ratio > 0.45 and dark_ratio > 0.03:
        return "Resume"

    return "Unknown/Other"


def get_nlp_guidance(problem_text: str) -> str:
    """
    Run the user's problem description through the NLP intent matcher
    and return targeted, step-by-step guidance for that intent.
    """
    # Problem → intent → targeted guidance map
    SCREENSHOT_GUIDANCE = {
        "apply_job": (
            "**Can't apply for a job?** Here are your next steps:\n"
            "1. Make sure you are **logged in** as a User (not a Visitor).\n"
            "2. Go to **Explore Jobs**, find the role, and click **Apply Now**.\n"
            "3. If the button is greyed out, the position may be closed or you've already applied.\n"
            "4. Ensure your **resume is uploaded** in your Profile — some jobs require it."
        ),
        "login": (
            "**Having trouble logging in?** Follow these steps:\n"
            "1. Click **Login** at the top-right of the page.\n"
            "2. Enter your registered email and password.\n"
            "3. If you forgot your password, click **Forgot Password** to reset via email.\n"
            "4. If you still can't log in, try clearing browser cookies or use Incognito mode."
        ),
        "forgot_password": (
            "**Resetting your password:**\n"
            "1. Go to the **Login** page.\n"
            "2. Click **Forgot Password** below the login form.\n"
            "3. Enter your registered email address.\n"
            "4. Check your inbox for a reset link — check Spam if it doesn't arrive.\n"
            "5. Follow the link to set a new password."
        ),
        "register": (
            "**Creating an account:**\n"
            "1. Click **Register** at the top-right of the homepage.\n"
            "2. Fill in your name, email, and choose a role (User / Manager).\n"
            "3. Verify your email by clicking the link sent to your inbox.\n"
            "4. Complete your profile to start applying for jobs!"
        ),
        "interviews": (
            "**Interview section not loading or missing?**\n"
            "1. Navigate to your **User Dashboard** and click on **Interviews**.\n"
            "2. If no interviews appear, check if you've applied to jobs with AI interview requirements.\n"
            "3. Make sure your browser has **camera & microphone** permissions enabled.\n"
            "4. Try refreshing the page or using a different browser (Chrome recommended)."
        ),
        "manager_jobs": (
            "**Trouble posting a job as Manager?**\n"
            "1. Go to your **Manager Dashboard** → **Job Updates** tab.\n"
            "2. Click **Post New Job** and fill in the title, description, and requirements.\n"
            "3. Make sure your company profile is verified — unverified accounts cannot post jobs.\n"
            "4. Save and **Publish** the listing when ready."
        ),
        "manager_applications": (
            "**Applications not showing up?**\n"
            "1. Go to **Manager Dashboard** → **Applications** tab.\n"
            "2. Use the filter to switch between Pending / Shortlisted / Rejected.\n"
            "3. Click any applicant's card to view their resume and details.\n"
            "4. Use **Shortlist** or **Reject** buttons to update their status."
        ),
        "manager_interviews": (
            "**Scheduling an interview as Manager:**\n"
            "1. Go to **Manager Dashboard** → **Interviews** panel.\n"
            "2. Search for the candidate by email and pick a date & time.\n"
            "3. The candidate will receive an automated invite email.\n"
            "4. You can edit or cancel the interview from the same panel."
        ),
        "subscriptions": (
            "**Subscription or payment issue?**\n"
            "1. Navigate to the **Subscriptions** page from the main menu.\n"
            "2. Choose your plan and click **Subscribe**.\n"
            "3. If a payment failed, check your card details and try again.\n"
            "4. For billing disputes, email support@hirehub.com with your order ID."
        ),
        "user_resume_nav": (
            "**Resume not uploading or displaying?**\n"
            "1. Go to **My Profile** → **Resume Builder** section.\n"
            "2. Upload a PDF (max 5MB). Other formats may not be supported.\n"
            "3. After upload, click **Save** to confirm.\n"
            "4. Refresh the page to verify the resume is visible."
        ),
        "admin_users": (
            "**User management issue (Admin):**\n"
            "1. Go to **Admin Portal** → **Users** section.\n"
            "2. Use the search bar to find the specific user.\n"
            "3. Click the user card to **Block**, **Unblock**, or **Delete** accounts.\n"
            "4. Changes take effect immediately."
        ),
    }

    if not problem_text or "fallback_dataset" not in globals():
        return None

    query = problem_text.lower().strip()
    query_tokens = set(query.split())
    all_intents = list(SCREENSHOT_GUIDANCE.keys())

    # --- Step 1: Check RL learned memory (exact match) ---
    if learned_responses and query in learned_responses:
        learned_intent = learned_responses[query]
        if learned_intent in SCREENSHOT_GUIDANCE:
            return SCREENSHOT_GUIDANCE[learned_intent]

    # --- Step 2: Check RL learned memory (fuzzy match) ---
    if learned_responses:
        matches = difflib.get_close_matches(query, learned_responses.keys(), n=1, cutoff=0.75)
        if matches:
            learned_intent = learned_responses[matches[0]]
            if learned_intent in SCREENSHOT_GUIDANCE:
                return SCREENSHOT_GUIDANCE[learned_intent]

    # --- Step 3: Fall back to training dataset token overlap ---
    best_prob = 0.0
    best_intent = "unknown"

    for intent, question in zip(fallback_dataset["intent"], fallback_dataset["question"]):
        if intent in all_intents:
            q_tokens = set(question.lower().split())
            overlap = len(query_tokens.intersection(q_tokens)) / (len(q_tokens) + 0.1)
            if overlap > best_prob:
                best_prob = overlap
                best_intent = intent

    if best_prob >= 0.08 and best_intent in SCREENSHOT_GUIDANCE:
        return SCREENSHOT_GUIDANCE[best_intent]
    return None


@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...), message: str = Form(None)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        label = classify_image_heuristic(image)

        # --- Screenshot Help Desk: prioritise user's problem description ---
        if message and message.strip():
            targeted = get_nlp_guidance(message)
            if targeted:
                # We recognised a specific problem — give step-by-step guidance
                reply = (
                    f"I can see your screenshot ({label}). "
                    f"Based on what you described: **\"{message}\"**\n\n"
                    f"{targeted}\n\n"
                    "Need more help? Just describe the exact error or step you're stuck on!"
                )
                return {"filename": file.filename, "classification": label, "reply": reply}

        # --- Fallback: generic guidance per image type ---
        if label == "Resume":
            reply = (
                "I can see this looks like a Resume!\n"
                "Here are some tips:\n"
                "- Make sure your skills and experience are up to date.\n"
                "- Upload your resume in User Profile under 'Resume Builder'.\n"
                "- Strong keywords improve ATS matching. Add relevant tech skills!\n\n"
                "If you're facing an issue, describe what's going wrong and re-send the screenshot."
            )
        elif label == "ID Card":
            reply = (
                "This looks like an ID Card or profile document.\n"
                "Please avoid sharing sensitive personal documents in chat.\n"
                "- To update your profile photo or details, go to My Profile.\n"
                "- For verification issues, contact support@hirehub.com.\n\n"
                "Describe the problem you're experiencing for more specific help."
            )
        elif label == "Dashboard Screenshot":
            if message:
                reply = (
                    f"I see your screenshot and your message: \"{message}\"\n\n"
                    "I can see a page from HireHub. Here are general next steps:\n"
                    "- If a button is missing or not working, try refreshing the page.\n"
                    "- If you can't access a section, check you are logged in with the right role.\n"
                    "- For navigation help, just type: 'Go to Jobs' or 'Open Applications'.\n\n"
                    "Tip: Describe the exact error message or what you expected to happen!"
                )
            else:
                reply = (
                    "I can see a HireHub dashboard screenshot!\n"
                    "Upload a screenshot along with a description of your problem for targeted help.\n"
                    "Example: 'I can't apply for this job' or 'My interviews are not showing up'."
                )
        else:
            reply = (
                "I received your image! To get the best help:\n"
                "1. Take a screenshot of the exact page or error.\n"
                "2. In the text box, describe what went wrong (e.g. 'I get an error when I click Apply').\n"
                "3. Send both together and I will guide you step by step!"
            )

        return {"filename": file.filename, "classification": label, "reply": reply}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
