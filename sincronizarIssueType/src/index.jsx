import api, { route } from "@forge/api";

export async function run(event, context) {
  // Ignora el evento si fue generado por el mismo plugin
  if (event.selfGenerated) {
    console.log("El evento fue generado por el plugin; se ignora.");
    return;
  }
  // Nombre del usuario a ignorar
  const exalateUserName = "Exalate";

  // Paso 1: Obtener el ID del usuario "Exalate" llamando a la API de búsqueda de usuarios
  const userResponse = await api
    .asApp()
    .requestJira(route`/rest/api/3/user/search?query=${exalateUserName}`);
  const users = await userResponse.json();
  const exalateUser = users.find(
    (user) => user.displayName === exalateUserName
  );

  const exalateUserId = exalateUser.accountId;
  console.log(`ID del usuario Exalate: ${exalateUserId}`);

  // Paso 2: Verifica si el usuario que disparó el evento es "Exalate"
  const triggeringUserId = event.atlassianId;
  if (triggeringUserId === exalateUserId) {
    console.log("Evento ignorado porque fue generado por el usuario Exalate.");
    return;
  }



  console.log("Evento de actualización detectado:", event);

  //Info de trigger issue
  const issueKey = event.issue.key;
  const issueType = event.issue.fields.issuetype.name;
  const response = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${issueKey}`);
  const issueData = await response.json();

  // Paso 3: Validación para verificar si el proyecto es de tipo "service_desk"
  const projectType = issueData.fields.project.projectTypeKey;
  if (projectType === "service_desk") {
      console.log("El issue pertenece a un proyecto de Service Management; no se ejecutan acciones.");
      return;
  }

  // Llama a la API de Jira para obtener la lista de todos los campos
  const fieldsResponse = await api
    .asApp()
    .requestJira(route`/rest/api/3/field`);
  const fields = await fieldsResponse.json();

  // Nombre del campo personalizado
  const customFieldName = "issueSync";

  // Encuentra el campo personalizado por nombre
  const customField = fields.find((field) => field.name === customFieldName);

  // Ahora obtenemos el valor del campo personalizado
  const relatedIssueKey = issueData.fields[customField.id];

  console.log("Clave del Issue:", issueKey);
  console.log("Key del issue a mover: " + relatedIssueKey);

  if (relatedIssueKey) {
    try {
      // Llama a la API de Jira para obtener la información del issue relacionado
      const response = await api
        .asApp()
        .requestJira(route`/rest/api/3/issue/${relatedIssueKey}`);
      const relatedIssueData = await response.json();
      //console.log("RelatedIssue", relatedIssueData)

      const relatedIssueType = relatedIssueData.fields.issuetype.name;
      const relatedStatusId = relatedIssueData.fields.status.id;
      const relatedProjectKey = relatedIssueData.fields.project.key;

      // Comparar los issuetypes
      if (issueType != relatedIssueType) {
        // Obtén el ID del tipo de issue actual del primer issue
        const IssueTypeId = event.issue.fields.issuetype.id;
        const statusId = event.issue.fields.status.id;

        console.log("relatedProjectKey: " + relatedProjectKey);
        console.log("IssueTypeId: " + IssueTypeId);
        console.log("relatedIssueKey: " + relatedIssueKey);
        console.log("relatedStatusId: " + relatedStatusId);
        console.log("statusId: " + statusId);

        // Construye el cuerpo de la solicitud para mover el issue
        
              // Construye el objeto `bodyData` explícitamente
              const bodyData = {
                sendBulkNotification: false,
                targetToSourcesMapping: {}
              };
      
              // Define la clave única del mapping y sus valores
              bodyData.targetToSourcesMapping[`${String(relatedProjectKey)},${String(IssueTypeId)}`] = {
                inferClassificationDefaults: true,
                inferFieldDefaults: true,
                inferStatusDefaults: false,
                inferSubtaskTypeDefault: true,
                issueIdsOrKeys: [String(relatedIssueKey)],
                targetStatus: [
                  {
                    statuses: {
                      [String(statusId)]: [String(relatedStatusId)]
                    }
                  }
                ]
              };

      const updateResponse = await api.asApp().requestJira(route`/rest/api/3/bulk/issues/move`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),  // Convierte bodyData a JSON
      });

        //---------------------------

        if (updateResponse.ok) {
          console.log(
            `El tipo de issue del issue ${relatedIssueKey} se actualizó a ${issueType}.`
          );
        } else {
          console.error(
            `Error al actualizar el tipo de issue: ${updateResponse.status} - ${updateResponse.statusText}`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error al obtener el issue relacionado ${relatedIssueKey}:`,
        error
      );
    }
  } else {
    console.log(
      "El campo personalizado no contiene una clave de issue válida."
    );
  }
}
