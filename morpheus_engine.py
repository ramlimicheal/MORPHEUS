import argparse
import sys
import time
import os
from morpheus_memory import MorpheusMemory

RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title):
    clear_screen()
    print(f"{CYAN}{BOLD}======================================================{RESET}")
    print(f"{CYAN}{BOLD}             MORPHEUS ENGINE : {title}{RESET}")
    print(f"{CYAN}{BOLD}======================================================{RESET}\n")

def run_somatic(axiom: str):
    """
    Transient Hypofrontality Protocol
    30 Breaths -> Exhale Hold -> Override
    """
    print_header("SOMATIC SHOCK OVERRIDE")
    print(f"Goal: Induce Transient Hypofrontality to bypass the 50 bps conscious limit.\n")
    print(f"Prepare for 30 deep power-breaths (In through nose, out through mouth).")
    input(f"{YELLOW}Press ENTER to begin breath metronome...{RESET}")
    
    # 30 Breaths
    breath_cycle = 2.0 # 1s IN, 1s OUT
    try:
        for i in range(1, 31):
            sys.stdout.write(f"\r{BOLD}BREATH {i}/30: {GREEN}IN...{RESET}")
            sys.stdout.flush()
            time.sleep(1.0)
            sys.stdout.write(f"\r{BOLD}BREATH {i}/30: {RED}OUT..{RESET}")
            sys.stdout.flush()
            time.sleep(1.0)
        
        # The Hold
        print(f"\n\n{RED}{BOLD}★★★ FULL EXHALE. HOLD THE VACUUM. ★★★{RESET}")
        print("Wait for the 45-second override window...")
        
        hold_time = 0
        override_triggered = False
        while True:
            sys.stdout.write(f"\rElapsed Hold: {hold_time} seconds (Press Ctrl+C when you break)")
            sys.stdout.flush()
            
            if hold_time >= 45 and not override_triggered:
                print(f"\n\n{CYAN}{BOLD}>>> PREFRONTAL CORTEX CRASH DETECTED. SUBCONSCIOUS EXPOSED. <<<{RESET}")
                print(f"{CYAN}{BOLD}INJECT AXIOM NOW:{RESET} {axiom}\n")
                override_triggered = True
                
            time.sleep(1.0)
            hold_time += 1
            
    except KeyboardInterrupt:
        print(f"\n\n{GREEN}Recovery Breath. Hold for 15 seconds, then release.{RESET}")
        time.sleep(15)
        print("Protocol Complete.")
    
    notes = input(f"\n{YELLOW}Journal somatic feedback (or press Enter to skip): {RESET}")
    
    mem = MorpheusMemory()
    mem.log_session("somatic", hold_time, axiom, notes)
    print("Somatic Override logged.")

def run_twilight(duration_min: int, axiom: str):
    """
    Theta-State Sleep/Wake Protocol
    """
    print_header("TWILIGHT THETA-STATE")
    print(f"Entering {duration_min} minute drift state.")
    print("Do not formulate sentences. Feel the physical frequency of the axiom.")
    print(f"AXIOM: {axiom}\n")
    input(f"{YELLOW}Press ENTER to begin...{RESET}")
    
    total_sec = duration_min * 60
    try:
        for rem in range(total_sec, 0, -1):
            sys.stdout.write(f"\r{CYAN}Fading... {rem//60:02d}:{rem%60:02d} remaining{RESET}")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSession interrupted.")

    print(f"\n\n{GREEN}Threshold closed.{RESET}")
    notes = input(f"{YELLOW}Journal hypnagogic imagery (or press Enter to skip): {RESET}")
    memory = MorpheusMemory()
    memory.log_session("twilight", total_sec, axiom, notes)

def run_lock():
    """
    Frequency Lock Protocol
    """
    print_header("FREQUENCY LOCK")
    print("The subconscious reads emotion and posture, not words.")
    print("1. Stand or sit with absolute structural authority.")
    print("2. Recall the exact physical sensation of your axiom being true.")
    input(f"\n{YELLOW}Press ENTER when the physical frequency is locked...{RESET}")
    
    print("\nLock established in background. Proceed with your tasks.")
    notes = input(f"\n{YELLOW}Describe the physical sensation (e.g., chest expansion, heart rate): {RESET}")
    memory = MorpheusMemory()
    memory.log_session("frequency_lock", 0, "", notes)

def run_crucible():
    """
    Fatigue Bypass Protocol
    """
    print_header("THE CRUCIBLE (FATIGUE BYPASS)")
    print("Execute your task explicitly to the point of structural failure.")
    input(f"{YELLOW}Press ENTER when the conscious mind says 'I AM DONE'...{RESET}")
    
    print(f"\n{RED}{BOLD}CENTRAL GOVERNOR DETECTED. EGO FATIGUED.{RESET}")
    print(f"Initiating the 10% Surge to bypass to the 11M bps engine.")
    print("Push immediately for the next 5 minutes without hesitation.\n")
    
    surge_sec = 300
    try:
        for rem in range(surge_sec, 0, -1):
            sys.stdout.write(f"\r{RED}Surge Active: {rem//60:02d}:{rem%60:02d}{RESET} (Surrender the logic, let the body execute)")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
         pass
         
    print(f"\n\n{GREEN}{BOLD}BYPASS COMPLETE. SECOND WIND ATTAINED.{RESET}")
    notes = input(f"{YELLOW}Journal the transition feeling: {RESET}")
    memory = MorpheusMemory()
    memory.log_session("crucible", surge_sec, "", notes)

def run_stats():
    mem = MorpheusMemory()
    stats = mem.get_stats()
    
    print_header("SUBCONSCIOUS METRICS")
    print(f"{BOLD}Total Overrides:{RESET} {stats['total_overrides']}")
    print(f"{BOLD}Last Override:{RESET} {stats['last_session']}\n")
    print(f"{BOLD}Breakdown:{RESET}")
    for k, v in stats['mode_breakdown'].items():
        print(f"  - {k}: {v}")
        
    print(f"\n{BOLD}Recent Manifestation Journals:{RESET}")
    for note in stats['recent_insights']:
        print(f"  > {note}")

def main():
    parser = argparse.ArgumentParser(description="MORPHEUS: Subconscious Activation Engine")
    subparsers = parser.add_subparsers(dest="mode", help="Unsealing protocol modes")

    # Somatic Mode
    parser_som = subparsers.add_parser("somatic", help="Run Breath/Hypoxia override")
    parser_som.add_argument("--axiom", "-a", type=str, default="I AM SOVEREIGN", help="Structural command to inject")

    # Twilight Mode
    parser_twi = subparsers.add_parser("twilight", help="Run Theta-state transition")
    parser_twi.add_argument("--mins", "-m", type=int, default=10, help="Duration of fade in minutes")
    parser_twi.add_argument("--axiom", "-a", type=str, default="I AM SOVEREIGN", help="Structural command to inject")

    # Lock Mode
    parser_lck = subparsers.add_parser("lock", help="Execute physical frequency lock")

    # Crucible Mode
    parser_cru = subparsers.add_parser("crucible", help="Track a fatigue bypass surge")

    # Stats Mode
    parser_sts = subparsers.add_parser("stats", help="View overriding metrics")

    args = parser.parse_args()

    if args.mode == "somatic":
        run_somatic(args.axiom)
    elif args.mode == "twilight":
        run_twilight(args.mins, args.axiom)
    elif args.mode == "lock":
        run_lock()
    elif args.mode == "crucible":
        run_crucible()
    elif args.mode == "stats":
        run_stats()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
