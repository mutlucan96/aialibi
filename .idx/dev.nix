{pkgs}: {
  channel = "stable-24.05";
  packages = [
    # Using Node.js 22 to satisfy the project's engine requirement.
    pkgs.nodejs_22  
    pkgs.pnpm
  ];
  idx.extensions = [
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "pnpm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
