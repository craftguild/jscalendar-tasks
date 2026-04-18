PROJECT_NAME := jscalendar-tasks
VENDOR := craftguild
APP_DIR := /opt/$(VENDOR)/$(PROJECT_NAME)
RELEASES_DIR := $(APP_DIR)/releases
CURRENT_LINK := $(APP_DIR)/current
DATA_DIR := /var/lib/$(VENDOR)/$(PROJECT_NAME)
ATTACHMENTS_DIR := $(DATA_DIR)/attachments
DEFAULT_DIR := /etc/defaults/$(VENDOR)/$(PROJECT_NAME)
DEFAULT_FILE := $(DEFAULT_DIR)/$(PROJECT_NAME)
SYSTEMD_DIR := /etc/systemd/system
SYSTEMD_UNIT := $(PROJECT_NAME).service
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
	$(SUDO) install -d "$(DATA_DIR)"
	$(SUDO) install -d "$(ATTACHMENTS_DIR)"
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
	@if $(SUDO) test -e "$(DEFAULT_FILE)"; then \
		echo "Preserve existing $(DEFAULT_FILE)"; \
	else \
		$(SUDO) install -m 0644 systemd/defaults/$(PROJECT_NAME).env "$(DEFAULT_FILE)"; \
	fi
	$(SUDO) install -d "$(SYSTEMD_DIR)"
	$(SUDO) install -m 0644 systemd/$(SYSTEMD_UNIT) "$(SYSTEMD_DIR)/$(SYSTEMD_UNIT)"
