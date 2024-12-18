import React, { useState, useCallback } from 'react';
import ForgeReconciler, { Select, TextArea, Label, UserPicker } from '@forge/react';
import { CustomFieldEdit } from '@forge/react/jira';
import { view } from '@forge/bridge';
import { useEffect } from 'react';

const Edit = () => {
  const [value, setValue] = useState('');

  const onSubmit = useCallback(async () => {
    try {
      await view.submit(value);
      console.log("Se cargo bien, o no")
    } catch (e) {
      console.error(e);
    }
  }, [view, value]);

  const selectOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' }
  ];

  useEffect(()=> {

    console.log(value)
  },[value])


  return (
    <CustomFieldEdit onSubmit={onSubmit} hideActionButtons>
    <UserPicker
      label="Assignee"
      placeholder="Select a user"
      name="user"
      description="The selected user will be assigned to this task"
      onChange={(user) => {
        if (user && user.id) {
          setValue({ accountId: user.id });
        } else {
          setValue(null);
        }
      }}
    />
    
  </CustomFieldEdit>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>
);


/*
<CustomFieldEdit onSubmit={onSubmit} hideActionButtons>
      <Select appearance="default" options={selectOptions} onChange={handleOnChange} />
    </CustomFieldEdit>



    <TextArea
      id="area"
      placeholder="Enter long form text here"
      name="area"
      onChange={(e) => {
        setValue(e.target.value);
      }}
    />


*/