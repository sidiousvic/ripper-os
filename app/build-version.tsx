export default function BuildVersion() {
  const environment = process.env.NEXT_PUBLIC_BUILD_ENV;
  const label = environment === "local" ? "Local" : environment === "preview" ? "Preview" : null;
  return <p className="build-version" title={`Commit: ${process.env.NEXT_PUBLIC_BUILD_COMMIT}\nSource: ${process.env.NEXT_PUBLIC_BUILD_SOURCE}`}>
    v{process.env.NEXT_PUBLIC_APP_VERSION}{label && ` · ${label}`}
  </p>;
}
