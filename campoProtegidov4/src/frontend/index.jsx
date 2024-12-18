import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Text, User
} from "@forge/react";
import { view } from '@forge/bridge';

const View = () => {
  const [fieldValue, setFieldValue] = useState(null);

  useEffect(() => {
    view.getContext().then((context) => { setFieldValue(context.extension.fieldValue) });
  }, []);
  
  return (
    <>
    <User accountId={fieldValue? fieldValue.accountId : null} />
      
    </>
  );
};
ForgeReconciler.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>
);
//<Text>{fieldValue ? fieldValue : 'None'}</Text>