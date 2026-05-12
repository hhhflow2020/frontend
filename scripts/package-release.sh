#!/usr/bin/env bash
set -euo pipefail

rm -rf release
mkdir -p release

bun --filter ppanel-admin-web build
bun --filter ppanel-user-web build

tar -czf release/ppanel-admin-web.tar.gz -C apps/admin/dist .
tar -czf release/ppanel-user-web.tar.gz -C apps/user/dist .

