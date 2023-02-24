import { diffChars } from "diff";
import { app } from "../internal/registry";
import {
  Schema,
  InitialSchema,
  LatestSchema,
  zInitialSchema,
} from "../internal/types";
import convertAnnotations from "./convertAnnotations";
import Automerge from "automerge";
import migrateDocToLatest from "./migrateDocToLatest";
import unwrapSchema from "./unwrapSchema";
import sendExtensionError from "../internal/sendExtensionError";
import parseZodError from "./parseZodError";
import wrapSchema from "./wrapSchema";

const changeLatestAutomergeDoc = (oldDoc: LatestSchema, doc: InitialSchema) => {
  const changes = diffChars(oldDoc.content.toString(), doc.content);
  let contentIndex = 0;
  changes.forEach((change) => {
    if (change.removed) {
      oldDoc.content.deleteAt?.(contentIndex, change.value.length);
    } else {
      const text = new Automerge.Text(change.value);
      if (change.added) oldDoc.content.insertAt?.(contentIndex, ...text);
      contentIndex += text.length;
    }
  });
  if (!oldDoc.annotations) oldDoc.annotations = [];
  oldDoc.annotations
    .slice(0, doc.annotations.length)
    .forEach((annotation, index) => {
      const newAnnotation = doc.annotations[index];
      const startDiff = newAnnotation.start - annotation.startIndex.value;
      if (startDiff > 0) {
        annotation.startIndex.increment(startDiff);
      } else if (startDiff < 0) {
        annotation.startIndex.decrement(-startDiff);
      }
      const endDiff = newAnnotation.end - annotation.endIndex.value;
      if (endDiff > 0) {
        annotation.endIndex.increment(endDiff);
      } else if (endDiff < 0) {
        annotation.endIndex.decrement(-endDiff);
      }
      const oldAttrs = (annotation.attributes || {}) as Record<
        string,
        string | number
      >;
      const newAttrs = (newAnnotation.attributes || {}) as Record<
        string,
        string | number
      >;
      if (annotation.type !== newAnnotation.type) {
        annotation.type = newAnnotation.type;
        Object.keys(oldAttrs).forEach((key) => {
          if (!newAttrs[key]) delete oldAttrs[key];
        });
        Object.keys(newAttrs).forEach((key) => {
          oldAttrs[key] = newAttrs[key];
        });
        delete annotation.appAttributes;
        if (newAnnotation.appAttributes)
          annotation.appAttributes = newAnnotation.appAttributes;
      } else {
        Object.keys(newAttrs)
          .filter((key) => newAttrs[key] !== oldAttrs[key])
          .forEach((key) => {
            oldAttrs[key] = newAttrs[key];
          });
        const oldCustomAttrs = annotation.appAttributes?.[app] || {};
        const newCustomAttrs = newAnnotation.appAttributes?.[app] || {};
        Object.keys(oldCustomAttrs).forEach((key) => {
          if (!oldCustomAttrs[key]) delete oldCustomAttrs[key];
        });
        Object.keys(newCustomAttrs).forEach((key) => {
          oldCustomAttrs[key] = newCustomAttrs[key];
        });
      }
    });
  if (oldDoc.annotations.length > doc.annotations.length)
    oldDoc.annotations.splice(
      doc.annotations.length,
      oldDoc.annotations.length - doc.annotations.length
    );
  else if (oldDoc.annotations.length < doc.annotations.length)
    convertAnnotations(
      doc.annotations.slice(oldDoc.annotations.length)
    ).forEach((a) => oldDoc.annotations.push(a));
};

const changeAutomergeDoc = (oldDoc: Schema, doc: InitialSchema) => {
  const oldDocUnwrapped = unwrapSchema(oldDoc);
  const zOldResult = zInitialSchema.safeParse(oldDocUnwrapped);
  let oldDocAsLatest: LatestSchema;
  if (zOldResult.success) {
    oldDocAsLatest = migrateDocToLatest(oldDoc);
    changeLatestAutomergeDoc(oldDocAsLatest, doc);
  } else {
    const wrappedDoc = wrapSchema(doc);
    oldDoc.content.deleteAt?.(0, oldDoc.content.length);
    oldDoc.content.insertAt?.(0, ...wrappedDoc.content);
    if (!oldDoc.annotations) oldDoc.annotations = [];
    oldDoc.annotations.splice(0, oldDoc.annotations.length);
    oldDocAsLatest = oldDoc as LatestSchema;
    wrappedDoc.annotations.forEach((a) => oldDocAsLatest.annotations.push(a));
  }
  const changedDocUnwrapped = unwrapSchema(oldDocAsLatest);
  zInitialSchema.safeParseAsync(changedDocUnwrapped).then((zResult) => {
    if (!zResult.success) {
      sendExtensionError({
        type: "Document became invalid after change was made",
        data: {
          oldDoc: oldDocUnwrapped,
          doc,
          changedDoc: changedDocUnwrapped,
          errors: zResult.error,
          message: parseZodError(zResult.error),
        },
      });
    }
  });
};

export default changeAutomergeDoc;
