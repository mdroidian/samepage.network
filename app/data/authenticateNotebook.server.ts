import { NotFoundError, UnauthorizedError } from "~/data/errors.server";
import getMysql from "fuegojs/utils/mysql";

const authenticateNotebook = async (args: {
  notebookUuid: string;
  token: string;
  requestId: string;
}) => {
  const { notebookUuid, token, requestId } = args;
  const cxn = await getMysql(requestId);
  const [tokenLinks] = await cxn.execute(
    `SELECT token_uuid FROM token_notebook_links
      where notebook_uuid = ?`,
    [notebookUuid]
  );
  const tokens = tokenLinks as { token_uuid: string }[];
  if (!tokens.length) {
    throw new NotFoundError(
      notebookUuid
        ? `Could not find Notebook with the Universal Id: ${notebookUuid}`
        : "There is no Notebook Universal Id assigned to this notebook. Make sure to go through the onboarding flow in order to be properly assigned a Universal Id."
    );
  }
  const authenticated = await tokens
    .map(
      (t) => () =>
        cxn
          .execute(
            `SELECT value FROM tokens 
    where uuid = ?`,
            [t.token_uuid]
          )
          .then(([values]) => {
            const storedValue = (values as { value: string }[])?.[0]?.value;
            if (!storedValue) return undefined;
            // should I just query by stored value?
            if (token !== storedValue)
              throw new UnauthorizedError(`Unauthorized notebook and token`);
            return token === storedValue ? t.token_uuid : undefined;
          })
    )
    .reduce(
      (p, c) => p.then((f) => f || c()),
      Promise.resolve<string | undefined>(undefined)
    );
  if (!authenticated)
    throw new UnauthorizedError(`Unauthorized notebook and token`);
  return authenticated;
};

export default authenticateNotebook;
