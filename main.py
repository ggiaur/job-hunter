import logging, sys
from dotenv import load_dotenv
from agents.job_search_agent import JobSearchAgent
load_dotenv(); logging.basicConfig(level=logging.INFO)
def main(): return 0 if JobSearchAgent().run() else 1
if __name__ == "__main__": sys.exit(main())
