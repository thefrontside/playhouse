executables_url() {
    echo "http://localhost:3000/api/idp/executables"
}
download_url() {
    echo "http://localhost:7007/api/idp/executables/dist"
}

info() {
    local action="$1"
    local details="$2"
    command printf '\033[1;32m%12s\033[0m %s\n' "$action" "$details" 1>&2
}

error() {
    command printf '\033[1;31mError\033[0m: %s\n\n' "$1" 1>&2
}

warning() {
    command printf '\033[1;33mWarning\033[0m: %s\n\n' "$1" 1>&2
}

request() {
    command printf '\033[1m%s\033[0m\n' "$1" 1>&2
}

eprintf() {
    command printf '%s\n' "$1" 1>&2
}

bold() {
    command printf '\033[1m%s\033[0m' "$1"
}

usage() {
    cat >&2 <<END_USAGE
install.sh: Install idp executables

USAGE:
    install.sh [FLAGS] [OPTIONS]

FLAGS:
    -h, --help                  Prints help information

OPTIONS:
        --skip-setup            Do not modify startup scripts
END_USAGE
}

idp_home_is_ok() {
    if [ -n "${IDP_HOME-}" ] && [ -e "$IDP_HOME" ] && ! [ -d "$IDP_HOME" ]; then
        error "\$IDP_HOME is set but is not a directory ($IDP_HOME)."
        eprintf "Please check your profile scripts and environment."
        return 1
    fi
    return 0
}

parse_os_info() {
    case "$(uname)" in
        Linux)
            echo "x86_64-unknown-linux-gnu"
            ;;
        Darwin)
            if [[ "$(uname -m)" == "arm64" ]]; then
                echo "aarch64-apple-darwin"
            else
                echo "x86_64-apple-darwin"
            fi
            ;;
        *)
            error "$(uname) is not supported"
            exit 1
    esac
}

parse_os_pretty() {
    local uname_str="$1"

    case "$uname_str" in
        Linux)
            echo "Linux"
            ;;
        Darwin)
            echo "macOS"
            ;;
        *)
            echo "$uname_str"
    esac
}

download_executable_from_backstage() {
    local os_info="$1"
    local tmpdir="$2"

    local filename="my-idp-$os_info"
    local download_file="$tmpdir/$filename"
    local archive_url="$(download_url)/$filename"
    curl --progress-bar --show-error --location "$archive_url" --output "$download_file" --write-out '%{filename_effective}'
}

download_executable() {
    local uname_str="$(uname -s)"
    local os_info="$(parse_os_info)"
    local pretty_os_name="$(parse_os_pretty `uname`)"

    info 'Fetching' "archive for $pretty_os_name"
    # store the downloaded archive in a temporary directory
    local download_dir="$(mktemp -d)"
    download_executable_from_backstage "$os_info" "$download_dir"
}

create_tree() {
    local install_dir="$1"

    info 'Creating' "directory layout"

    # .idp/
    #     bin/

    mkdir -p "$install_dir" && mkdir -p "$install_dir"/bin
    if [ "$?" != 0 ]
    then
        error "Could not create directory layout. Please make sure the target directory is writeable: $install_dir"
        exit 1
    fi
}

install_from_file() {
    local binfile="$1"
    local install_dir="$2"

    create_tree "$install_dir"

    info 'Extracting' "IDP binaries"
    # extract the files to the specified directory
    cp -c "$binfile" "$install_dir"/bin/idp
    chmod a+x "$install_dir"/bin/idp
}

install_remote() {
    local install_dir="$1"

    info 'Checking' "for existing IDP installation"

    download_archive="$(download_executable; exit "$?")"
    exit_status="$?"
    if [ "$exit_status" != 0 ]
    then
        error "Could not download IDP executable. See $(executables_url) for a list of available executables"
        return "$exit_status"
    fi

    install_from_file "$download_archive" "$install_dir"

}

install() {
  local install_dir="$1"
  local should_run_setup="$2"

  if ! idp_home_is_ok; then
    exit 1
  fi

  if [ -e "$install_dir/bin/idp" ]; then
      info "Upgrade" "new executable will overwrite existing version"
  fi

  install_remote "$install_dir"

  if [ "$?" == 0 ]
  then
      if [ "$should_run_setup" == "true" ]; then
        info 'Finished' "installation. Updating user profile settings."
        #"$install_dir"/bin/idp setup
      else
        info 'Finished' "installation. No changes were made to user profile settings."
      fi
  fi
}


# return if sourced (for testing the functions above)
return 0 2>/dev/null

# default to running setup after installing
should_run_setup="true"

# install to IDP_HOME, defaulting to ~/.volta
install_dir="${IDP_HOME:-"$HOME/.idp"}"

# parse command line options
while [ $# -gt 0 ]
do
  arg="$1"

  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
    --skip-setup)
      shift # shift off the argument
      should_run_setup="false"
      ;;
    *)
      error "unknown option: '$arg'"
      usage
      exit 1
      ;;
  esac
done

install "$install_dir" "$should_run_setup"
