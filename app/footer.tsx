import Image from "next/image";
import BuildVersion from "./build-version";

export default function Footer() {
  return <footer className="shell footer">
    <div className="sidiousware-lockup">
      <Image src="/brand/sidiousware-logo.png" alt="Sidiousware" width={330} height={191} />
    </div>
    <p><a href="https://github.com/sidiousvic/ripper-os/issues/new?title=Bug%3A%20&body=%23%23%20What%20happened%3F%0A%0A%23%23%20How%20can%20we%20reproduce%20it%3F%0A%0A%23%23%20Browser%20and%20device%0A" target="_blank" rel="noreferrer">Report a bug 🪲</a></p>
    <BuildVersion />
  </footer>;
}
