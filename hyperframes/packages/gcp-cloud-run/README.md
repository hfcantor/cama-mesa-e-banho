# @hfr/gcp-cloud-run

Google Cloud Run service: HTTP render endpoint reading projects from / writing videos to Cloud Storage.

## Uso

```bash
docker build -f packages/gcp-cloud-run/Dockerfile -t hfr-render .
curl -X POST $URL/render -H 'content-type: application/json' -d '{"project":"gs://b/proj/","output":"gs://b/out.mp4"}'
```
**Não testado contra o GCP real neste ambiente**; a lógica foi testada localmente com `file://`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
