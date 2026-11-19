# @hfr/aws-lambda

AWS Lambda (container image) handler: renders a project stored in S3 and uploads the video to S3.

## Uso

```bash
docker build -f packages/aws-lambda/Dockerfile -t hfr-lambda .
# invoque com {"project":"s3://bucket/proj.zip","output":"s3://bucket/out.mp4","options":{"quality":"high"}}
```
**Não testado contra a AWS real neste ambiente**; a lógica foi testada localmente com `file://`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
