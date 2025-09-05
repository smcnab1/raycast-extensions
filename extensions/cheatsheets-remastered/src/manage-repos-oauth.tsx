import React from "react";
import { List, ActionPanel, Action, Icon, showToast, Toast, confirmAlert, Alert, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { withAccessToken, getAccessToken } from "@raycast/utils";
import Service, { UserRepository } from "./service";
import { showFailureToast } from "@raycast/utils";
import { githubOAuth } from "./github-oauth";

function ManageReposWithAuth() {
  const [repos, setRepos] = useState<UserRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const { push } = useNavigation();
  const { token } = getAccessToken();

  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    try {
      setIsLoading(true);
      const userRepos = await Service.getUserRepositories();
      setRepos(userRepos);
    } catch (error) {
      showFailureToast(error, { title: "Failed to load repositories" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteRepo(id: string, name: string, owner: string) {
    const confirmed = await confirmAlert({
      title: "Remove Repository",
      message: `Are you sure you want to remove "${owner}/${name}" from your repositories?`,
      primaryAction: {
        title: "Remove",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await Service.removeUserRepository(id);
        await loadRepos();
      } catch (err) {
        showFailureToast(err, { title: "Failed to remove repository" });
      }
    }
  }

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchText.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchText.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      actions={
        <ActionPanel>
          <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadRepos} />
          <Action
            title="Add Repository"
            icon={Icon.Plus}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={() => push(<AddRepositoryForm onAdded={loadRepos} />)}
          />
        </ActionPanel>
      }
    >
      <List.Section title="Your Repositories" subtitle={`${filteredRepos.length} repositories`} />
      {filteredRepos.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Box}
          title="No repositories found"
          description={
            searchText ? `No repositories match "${searchText}"` : "Add your first repository to get started"
          }
          actions={
            <ActionPanel>
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadRepos} />
              <Action
                title="Add Repository"
                icon={Icon.Plus}
                onAction={() => push(<AddRepositoryForm onAdded={loadRepos} />)}
              />
            </ActionPanel>
          }
        />
      ) : (
        filteredRepos.map((repo) => (
          <List.Item
            key={repo.id}
            title={repo.name}
            subtitle={repo.description || `${repo.owner}/${repo.name}`}
            icon={repo.isPrivate ? Icon.Lock : Icon.Box}
            accessories={[
              { text: repo.owner, icon: Icon.Person },
              { text: repo.defaultBranch, icon: Icon.Code },
              ...(repo.subdirectory ? [{ text: repo.subdirectory, icon: Icon.Folder }] : []),
              ...(repo.lastSyncedAt ? [{ date: new Date(repo.lastSyncedAt), icon: Icon.ArrowClockwise }] : []),
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="Repository Actions">
                  <Action.Push
                    title="View Details"
                    icon={Icon.Window}
                    target={<RepositoryDetailsWithAuth repo={repo} onUpdated={loadRepos} />}
                  />
                  <Action.OpenInBrowser
                    title="Open in Browser"
                    url={repo.url}
                    icon={Icon.Globe}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy URL"
                    content={repo.url}
                    icon={Icon.CopyClipboard}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action
                    title="Sync Repository"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={async () => {
                      try {
                        await Service.syncRepositoryFiles(repo, token);
                        await loadRepos();
                      } catch (error) {
                        showFailureToast(error, { title: "Failed to sync repository" });
                      }
                    }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section title="Manage">
                  <Action.Push
                    title="Edit Repository"
                    icon={Icon.Pencil}
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                    target={<EditRepositoryForm repo={repo} onUpdated={loadRepos} />}
                  />
                  <Action
                    title="Remove Repository"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => handleDeleteRepo(repo.id, repo.name, repo.owner)}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

// Import the components we need
import { AddRepositoryForm } from "./add-repository-form";
import { EditRepositoryForm } from "./edit-repository-form";
import { RepositoryDetailsWithAuth } from "./repository-details-oauth";

// Export the OAuth-wrapped component
export default withAccessToken(githubOAuth)(ManageReposWithAuth);
