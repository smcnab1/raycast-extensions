import React from "react";
import { Form, ActionPanel, Action, Icon, showToast, Toast, LocalStorage, useNavigation } from "@raycast/api";
import { useState } from "react";
import Service from "./service";
import { showFailureToast } from "@raycast/utils";

type AddRepositoryFormValues = {
  name: string;
  owner: string;
  description?: string;
  url?: string;
  isPrivate: boolean;
  defaultBranch: string;
};

// Custom hook for draft persistence
function useDraftPersistence(key: string, defaultValue: string | boolean) {
  const [value, setValue] = useState(defaultValue);

  React.useEffect(() => {
    // Load draft from storage
    LocalStorage.getItem<string | boolean>(key).then((stored) => {
      if (stored !== undefined && stored !== defaultValue) {
        setValue(stored);
      }
    });
  }, [key, defaultValue]);

  const updateValue = (newValue: string | boolean) => {
    setValue(newValue);
    // Save to storage
    LocalStorage.setItem(key, newValue);
  };

  const clearDraft = () => {
    LocalStorage.removeItem(key);
    setValue(defaultValue);
  };

  return { value, updateValue, clearDraft };
}

export function AddRepositoryForm({ onAdded }: { onAdded?: () => void }) {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const {
    value: name,
    updateValue: updateName,
    clearDraft: clearNameDraft,
  } = useDraftPersistence("add-repo-name", "");

  const {
    value: owner,
    updateValue: updateOwner,
    clearDraft: clearOwnerDraft,
  } = useDraftPersistence("add-repo-owner", "");

  const {
    value: description,
    updateValue: updateDescription,
    clearDraft: clearDescriptionDraft,
  } = useDraftPersistence("add-repo-description", "");

  const {
    value: url,
    updateValue: updateUrl,
    clearDraft: clearUrlDraft,
  } = useDraftPersistence("add-repo-url", "");

  const {
    value: isPrivate,
    updateValue: updateIsPrivate,
    clearDraft: clearIsPrivateDraft,
  } = useDraftPersistence("add-repo-private", false);

  const {
    value: defaultBranch,
    updateValue: updateDefaultBranch,
    clearDraft: clearDefaultBranchDraft,
  } = useDraftPersistence("add-repo-branch", "main");

  const handleSubmit = async (values: AddRepositoryFormValues) => {
    try {
      setIsSubmitting(true);
      setShowErrors(true);

      // Client-side validation
      if (!values.name?.trim() || !values.owner?.trim()) {
        setIsSubmitting(false);
        return;
      }

      await Service.addUserRepository(
        values.name,
        values.owner,
        values.description,
        values.url,
        values.isPrivate,
        values.defaultBranch
      );

      // Clear drafts after successful submission
      clearNameDraft();
      clearOwnerDraft();
      clearDescriptionDraft();
      clearUrlDraft();
      clearIsPrivateDraft();
      clearDefaultBranchDraft();

      if (onAdded) {
        onAdded();
      }
      pop();
    } catch (error) {
      showFailureToast(error, { title: "Failed to add repository" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Repository" onSubmit={handleSubmit} icon={Icon.Plus} />
          <Action
            title="Reset Form"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => {
              clearNameDraft();
              clearOwnerDraft();
              clearDescriptionDraft();
              clearUrlDraft();
              clearIsPrivateDraft();
              clearDefaultBranchDraft();
              showToast({ style: Toast.Style.Success, title: "Form Reset" });
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        text="Add a new repository to your collection. You can manage and access it later from the Repos Manager."
        title="Add New Repository"
      />

      <Form.TextField
        id="name"
        title="Repository Name"
        placeholder="Enter repository name (e.g., 'my-awesome-project')"
        value={name as string}
        onChange={updateName as (value: string) => void}
        error={showErrors && !(name as string)?.trim() ? "Repository name is required" : undefined}
      />

      <Form.TextField
        id="owner"
        title="Owner"
        placeholder="Enter owner/username (e.g., 'octocat')"
        value={owner as string}
        onChange={updateOwner as (value: string) => void}
        error={showErrors && !(owner as string)?.trim() ? "Owner is required" : undefined}
      />

      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Enter optional repository description"
        value={description as string}
        onChange={updateDescription as (value: string) => void}
      />

      <Form.TextField
        id="url"
        title="Repository URL"
        placeholder="Enter repository URL (optional, will auto-generate if empty)"
        value={url as string}
        onChange={updateUrl as (value: string) => void}
      />

      <Form.Checkbox
        id="isPrivate"
        label="Private Repository"
        value={isPrivate as boolean}
        onChange={updateIsPrivate as (value: boolean) => void}
      />

      <Form.TextField
        id="defaultBranch"
        title="Default Branch"
        placeholder="Enter default branch name (e.g., 'main', 'master')"
        value={defaultBranch as string}
        onChange={updateDefaultBranch as (value: string) => void}
      />
    </Form>
  );
}

export default AddRepositoryForm;
