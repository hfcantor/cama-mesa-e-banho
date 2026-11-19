# @hfr/cloud-common

Shared cloud render logic: storage URIs (file://, s3://, gs://), project download/unpack, render + upload.

## Uso

Usado por `aws-lambda` e `gcp-cloud-run`. Fontes: prefixos ou `.zip` em `s3://`, `gs://` ou `file://` (com `HFR_ALLOW_FILE_STORAGE=1`).

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
