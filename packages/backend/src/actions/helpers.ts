export const generateGitRepoUrl = ({
  repoName,
  owner,
  host,
}: {
  repoName: string;
  owner: string;
  host: string;
}) => (repoName && owner ? `${host}?repo=${repoName}&owner=${owner}` : host);

