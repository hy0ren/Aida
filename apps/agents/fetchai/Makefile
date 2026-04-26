.PHONY: setup addresses orchestrator insurance scheduler translator client smoke

setup:
	python3 -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt

addresses:
	. .venv/bin/activate && python agents.py addresses

orchestrator:
	. .venv/bin/activate && python agents.py orchestrator

insurance:
	. .venv/bin/activate && python agents.py insurance

scheduler:
	. .venv/bin/activate && python agents.py scheduler

translator:
	. .venv/bin/activate && python agents.py translator

client:
	. .venv/bin/activate && python client.py

smoke:
	. .venv/bin/activate && python test_asi1_agent.py "$$AIDA_ORCHESTRATOR_AGENT_ADDRESS"

