import { EventTag } from "../types";
import { EventSchema } from "@syftdata/common/lib/types";
import ReactElementView from "./ReactElementView";
import TagHandlerList from "./TagHandlerList";
import { useState } from "react";
import { EventsView } from "./EventsView";
import SimpleEventModal from "./SimpleEventModal";

export interface TagDetailedViewProps {
  tag: EventTag;
  onUpdateTag: (action?: EventTag) => void;
  onUpdateSchema: (schema: EventSchema) => void;
  onAddSchema: (schema: EventSchema) => void;
  onMagicWand: () => void;
  schemas: EventSchema[];
}

export default function TagDetailedView({
  tag,
  onAddSchema,
  onUpdateSchema,
  onUpdateTag,
  onMagicWand,
  schemas,
}: TagDetailedViewProps) {
  const handlers = [...Object.keys(tag.handlerToEvents)].sort();
  const [selectedHandler, setSelectedHandler] = useState<string>(handlers[0]);
  const [showActionModal, setShowActionModal] = useState(false);
  return (
    <>
      <TagHandlerList
        tag={tag}
        handlers={handlers}
        selectedHandler={selectedHandler}
        onSelect={setSelectedHandler}
      />
      {selectedHandler && (
        <EventsView
          tag={tag}
          handler={selectedHandler}
          onEdit={() => setShowActionModal(true)}
          updateSchema={(schema) => {
            onUpdateSchema(schema);
          }}
          setEvents={(handler, events) => {
            onUpdateTag({
              ...tag,
              handlerToEvents: {
                ...tag.handlerToEvents,
                [handler]: events,
              },
            });
          }}
          schemas={schemas}
        />
      )}
      <ReactElementView element={tag} />
      <SimpleEventModal
        key={`${tag.reactSource.name}:${selectedHandler}`}
        open={showActionModal}
        tag={tag}
        schemas={schemas}
        onMagicWand={() => {
          onMagicWand();
          setShowActionModal(false);
        }}
        handler={selectedHandler}
        addSchema={(tag, schema) => {
          if (schema) {
            onAddSchema(schema);
          }
          onUpdateTag(tag);
          setShowActionModal(false);
        }}
        onCancel={() => setShowActionModal(false)}
      />
    </>
  );
}
