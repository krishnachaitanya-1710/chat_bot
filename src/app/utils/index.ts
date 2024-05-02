export interface Message {
    type: string,
    content: string,
    actions: Boolean,
    submitActions: Boolean
}

export const labels = {
    'create': 'Create a new global variable',
    'delete': 'Delete a exist global variable',
    'update': 'Update a exist global variable',
}

export const keywords = {
    'create': ['create', 'add', 'generate'],
    'delete': ['delete', 'remove'],
    'update': ['update', 'edit']
}
