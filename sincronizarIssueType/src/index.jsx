import api, { route } from '@forge/api';

export async function run(event, context) {


// Ignora el evento si fue generado por el mismo plugin
  if (event.selfGenerated) {
    console.log("El evento fue generado por el plugin; se ignora.");
    return;
  }


  console.log("Evento de actualización detectado:", event);

  //Info de trigger issue
  const issueKey = event.issue.key;
  const issueType = event.issue.fields.issuetype.name;
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`);
  const issueData = await response.json();

  // Llama a la API de Jira para obtener la lista de todos los campos
  const fieldsResponse = await api.asApp().requestJira(route`/rest/api/3/field`);
  const fields = await fieldsResponse.json();
  // Nombre del campo personalizado
  const customFieldName = "KeyIssueSincronizado";
  // Encuentra el campo personalizado por nombre
  const customField = fields.find(field => field.name === customFieldName);


  // Ahora obtenemos el valor del campo personalizado
  const relatedIssueKey = issueData.fields[customField.id];

  console.log("Clave del Issue:", issueKey);



  console.log("Key del issue a mover: " + relatedIssueKey)

  if (relatedIssueKey) {
    try {
      // Llama a la API de Jira para obtener la información del issue relacionado
      const response = await api.asApp().requestJira(route`/rest/api/3/issue/${relatedIssueKey}`);
      const relatedIssueData = await response.json();

      const relatedIssueType = relatedIssueData.fields.issuetype.name;
      
      // Comparar los issuetypes
      if (issueType !== relatedIssueType) {
        // Obtén el ID del tipo de issue actual del primer issue
        const targetIssueTypeId = event.issue.fields.issuetype.id;

        // Cambia el tipo de issue del segundo issue
        const updateResponse = await api.asApp().requestJira(route`/rest/api/3/issue/${relatedIssueKey}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              issuetype: {
                id: targetIssueTypeId
              }
            }
          })
        });

        if (updateResponse.ok) {
          console.log(`El tipo de issue del issue ${relatedIssueKey} se actualizó a ${issueType}.`);
        } else {
          console.error(`Error al actualizar el tipo de issue: ${updateResponse.status} - ${updateResponse.statusText}`);
        }
      }
    } catch (error) {
      console.error(`Error al obtener el issue relacionado ${relatedIssueKey}:`, error);
    }
  } else {
    console.log("El campo personalizado no contiene una clave de issue válida.");
  }
}