{
  description = "Flake for Holochain app development";

  inputs = {
    holonix.url = "github:holochain/holonix?ref=main-0.7";

    nixpkgs.follows = "holonix/nixpkgs";
    flake-parts.follows = "holonix/flake-parts";
  };

  # NOTE (Holochain 0.7 upgrade): the p2p-shipyard / holochainTauriDev shells and the
  # `androidDev` shell were removed here. `src-tauri/` is excluded from the cargo
  # workspace and nothing in the 0.7 upgrade builds it; the Tauri toolchain (webkitgtk
  # pin, android SDK) has to be restored when the Tauri app is brought to 0.7.
  outputs = inputs@{ flake-parts, ... }: flake-parts.lib.mkFlake { inherit inputs; } {
    systems = builtins.attrNames inputs.holonix.devShells;
    perSystem = { inputs', pkgs, ... }: {
      formatter = pkgs.nixpkgs-fmt;

      devShells.default = pkgs.mkShell {
        inputsFrom = [ inputs'.holonix.devShells.default ];

        packages = (with inputs'.holonix.packages; [
          holochain
          bootstrap-srv
          lair-keystore
          hc
          hn-introspect
          rust # For Rust development, with the WASM target included for zome builds
        ]) ++ (with pkgs; [
          nodejs_24 # For UI development
          binaryen # For WASM optimisation (wasm-opt)
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][holonix:\w]\$\[\033[0m\] '
        '';
      };
    };
  };
}
