export default function BuildVersion() {
  return <p className="build-version" title={`Commit: ${process.env.NEXT_PUBLIC_BUILD_COMMIT}`}>
    v{process.env.NEXT_PUBLIC_APP_VERSION} · {process.env.NEXT_PUBLIC_BUILD_SOURCE} · {process.env.NEXT_PUBLIC_BUILD_ENV}
  </p>;
}
