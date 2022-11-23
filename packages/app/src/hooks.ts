import { useCallback, useState } from "react";

/*
// usage
const [isEditing, setIsEditing] = useToggle();

return (
    <>
      {isEditing & <Editor>}
      <button onClick={setIsEditing}>Edit</button>
    </>
);
*/
export function useToggle(initialState = false): (boolean | (() => void))[] {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState((_state) => !_state), []);

  return [state, toggle];
}