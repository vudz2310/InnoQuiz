declare module "*.docx" {
  const assetUrl: string;
  export default assetUrl;
}

declare module "*.docx?url" {
  const assetUrl: string;
  export default assetUrl;
}
