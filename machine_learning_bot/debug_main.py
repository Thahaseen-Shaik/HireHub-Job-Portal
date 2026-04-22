import traceback

try:
    print("Testing main import...")
    import main
    print("MAIN LOADED SUCCESSFULLY")
except Exception as e:
    print("EXCEPTION OCCURRED:")
    traceback.print_exc()
