import os
import json
import mido

MIDI_DIR = "assets/midi"
OUT_FILE = "assets/generative_sequences.json"

def process_midi_files():
    sequences = {
        "focus": [],
        "relax": [],
        "sleep": [],
        "move": [],
        "study": [],
        "default": []
    }

    if not os.path.isdir(MIDI_DIR):
        print(f"Directory {MIDI_DIR} not found.")
        return

    files = [f for f in os.listdir(MIDI_DIR) if f.endswith(".mid") or f.endswith(".midi")]
    print(f"Found {len(files)} MIDI files.")

    for f in files:
        mood = "default"
        # Try to infer mood from filename
        fname_lower = f.lower()
        if "focus" in fname_lower: mood = "focus"
        elif "relax" in fname_lower: mood = "relax"
        elif "sleep" in fname_lower: mood = "sleep"
        elif "move" in fname_lower or "activity" in fname_lower: mood = "move"
        elif "study" in fname_lower: mood = "study"

        filepath = os.path.join(MIDI_DIR, f)
        
        try:
            mid = mido.MidiFile(filepath)
            seq = []
            current_time = 0.0
            
            for msg in mid:
                current_time += msg.time
                if msg.type == 'note_on' and msg.velocity > 0:
                    # Storing (note, velocity, absolute_time)
                    seq.append({
                        "n": msg.note,
                        "v": msg.velocity,
                        "t": round(current_time, 3)
                    })
            
            # Only keep significant sequences
            if len(seq) > 4:
                sequences[mood].append(seq)
                
        except Exception as e:
            print(f"Failed to parse {f}: {e}")

    # Remove empty moods
    clean_seqs = {k: v for k, v in sequences.items() if len(v) > 0}
    
    with open(OUT_FILE, 'w') as out:
        json.dump(clean_seqs, out, separators=(',', ':'))
        
    print(f"Successfully wrote parsed sequences to {OUT_FILE}.")
    total_seqs = sum(len(v) for v in clean_seqs.values())
    print(f"Total valid sequences extracted: {total_seqs}")

if __name__ == "__main__":
    process_midi_files()
