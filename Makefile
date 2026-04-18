PROJECT_NAME := jscalendar-tasks
VENDOR := craftguild
APP_DIR := /opt/$(VENDOR)/$(PROJECT_NAME)
RELEASES_DIR := $(APP_DIR)/releases
CURRENT_LINK := $(APP_DIR)/current
DATA_DIR := /var/lib/$(VENDOR)/$(PROJECT_NAME)
DEFAULT_DIR := /etc/defaults/$(VENDOR)/$(PROJECT_NAME)
SYSTEMD_DIR := /etc/systemd/system
SYSTEMD_UNIT := $(PROJECT_NAME)@.service
INSTANCE ?= demo
PORT := 3000
DEMO_MODE := false
INSTANCE_DATA_DIR := $(DATA_DIR)/$(INSTANCE)
INSTANCE_ATTACHMENTS_DIR := $(INSTANCE_DATA_DIR)/attachments
DEFAULT_FILE := $(DEFAULT_DIR)/$(INSTANCE)
SUDO ?= sudo

.DEFAULT_GOAL := build

.PHONY: prepare build install

prepare:
	npm exec prisma generate

build: prepare
	npm run build

install:
	@test "$$(uname -s)" = "Linux" || (echo "install target supports Linux only"; exit 1)
	@test -d .next/standalone || (echo ".next/standalone is missing. Run make build with Next.js standalone output first."; exit 1)
	@case "$(INSTANCE)" in *[!A-Za-z0-9_.-]*|"") echo "INSTANCE must contain only letters, numbers, dot, underscore, or hyphen"; exit 1 ;; esac
	$(SUDO) install -d "$(DATA_DIR)"
	$(SUDO) install -d "$(INSTANCE_ATTACHMENTS_DIR)"
	@release_id="$$(date +%s)"; \
	release_dir="$(RELEASES_DIR)/$$release_id"; \
	$(SUDO) install -d "$$release_dir"; \
	$(SUDO) cp -R .next/standalone/. "$$release_dir/"; \
	$(SUDO) install -d "$$release_dir/.next/static"; \
	$(SUDO) cp -R .next/static/. "$$release_dir/.next/static/"; \
	if [ -d public ]; then $(SUDO) install -d "$$release_dir/public"; $(SUDO) cp -R public/. "$$release_dir/public/"; fi; \
	if [ -d prisma ]; then $(SUDO) install -d "$$release_dir/prisma"; $(SUDO) cp -R prisma/. "$$release_dir/prisma/"; fi; \
	$(SUDO) ln -sfnT "releases/$$release_id" "$(CURRENT_LINK)"; \
	echo "Installed $$release_dir and updated $(CURRENT_LINK)"
	$(SUDO) install -d "$(DEFAULT_DIR)"
	@tmp_file="$$(mktemp)"; \
	sed \
		-e "s|%INSTANCE%|$(INSTANCE)|g" \
		-e "s|%PORT%|$(PORT)|g" \
		-e "s|%DEMO_MODE%|$(DEMO_MODE)|g" \
		-e "s|%VENDOR%|$(VENDOR)|g" \
		-e "s|%PROJECT_NAME%|$(PROJECT_NAME)|g" \
		systemd/defaults/instance.env.in > "$$tmp_file"; \
	if $(SUDO) test -e "$(DEFAULT_FILE)"; then \
		$(SUDO) install -m 0644 "$$tmp_file" "$(DEFAULT_FILE).dist"; \
		echo "Preserve existing $(DEFAULT_FILE) and installed $(DEFAULT_FILE).dist"; \
	else \
		$(SUDO) install -m 0644 "$$tmp_file" "$(DEFAULT_FILE)"; \
	fi; \
	rm -f "$$tmp_file"
	$(SUDO) install -d "$(SYSTEMD_DIR)"
	$(SUDO) install -m 0644 systemd/$(SYSTEMD_UNIT) "$(SYSTEMD_DIR)/$(SYSTEMD_UNIT)"
