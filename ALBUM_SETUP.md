# Album Feature - Appwrite Database Setup Guide

## Overview
This guide explains how to set up the Albums collection in Appwrite to enable bookmark organization.

## Required Collections

### 1. Albums Collection
**Collection ID:** `albums`

#### Attributes:
| Attribute | Type | Size | Required | Array | Default |
|-----------|------|------|----------|-------|---------|
| name | String | 255 | Yes | No | - |
| description | String | 1000 | No | No | "" |
| user | Relationship | - | Yes | No | - |
| isDefault | Boolean | - | No | No | false |

#### Relationship Configuration:
- **user** attribute:
  - Type: Many-to-One
  - Related Collection: `users` (ID: `66296f5c795d9e7023cc`)
  - Relationship Type: Many albums can belong to one user
  - On Delete: Cascade (delete albums when user is deleted)

#### Indexes:
1. **by_user**
   - Type: Key
   - Attributes: `user` (ASC)
   - Purpose: Fast lookup of all albums for a user

2. **by_user_created**
   - Type: Key
   - Attributes: `user` (ASC), `$createdAt` (ASC)
   - Purpose: Get user's albums ordered by creation date

### 2. Update Bookmarks Collection
**Collection ID:** `bookmarks`

#### Add New Attribute:
| Attribute | Type | Size | Required | Array | Default |
|-----------|------|------|----------|-------|---------|
| album | Relationship | - | No | No | null |

#### Relationship Configuration:
- **album** attribute:
  - Type: Many-to-One
  - Related Collection: `albums` (ID: `albums`)
  - Relationship Type: Many bookmarks can belong to one album
  - On Delete: Set NULL (when album is deleted, bookmarks become unassigned)

#### Update Indexes:
Add these indexes to the bookmarks collection:

3. **by_user_album**
   - Type: Key
   - Attributes: `user` (ASC), `album` (ASC)
   - Purpose: Fast filtering of bookmarks by user and album

4. **by_album**
   - Type: Key
   - Attributes: `album` (ASC)
   - Purpose: Get all bookmarks in an album

## Setup Steps in Appwrite Console

### Step 1: Create Albums Collection
1. Go to your Appwrite Console
2. Navigate to Databases → Select your database (`66296f08c154213bd921`)
3. Click "Add Collection"
4. Set Collection ID: `albums`
5. Set Collection Name: "Albums"
6. Click "Create"

### Step 2: Add Albums Attributes
1. In the Albums collection, click "Add Attribute"
2. Add each attribute according to the table above:
   - **name**: String, 255 chars, Required
   - **description**: String, 1000 chars, Optional
   - **isDefault**: Boolean, Optional, Default: false
   - **user**: Relationship → Many-to-One → users collection → Cascade on delete

### Step 3: Add Albums Indexes
1. In the Albums collection, click "Indexes"
2. Add each index according to the specifications above

### Step 4: Configure Albums Permissions
1. In the Albums collection, go to "Settings" → "Permissions"
2. Add these permissions:
   - **Read**: `Any`
   - **Create**: `Any` (users can create their own albums)
   - **Update**: Role `user` (owner can update their albums)
   - **Delete**: Role `user` (owner can delete their albums)

### Step 5: Update Bookmarks Collection
1. Navigate to the Bookmarks collection (`bookmarks`)
2. Click "Add Attribute"
3. Add the **album** relationship:
   - Type: Relationship
   - Related Collection: albums
   - Relationship: Many-to-One
   - On Delete: Set NULL
   - Required: No

### Step 6: Update Bookmarks Indexes
1. In the Bookmarks collection, click "Indexes"
2. Add the new indexes for album filtering

## Verification
After setup, verify:
1. You can create an album via the app
2. You can bookmark a video and assign it to an album
3. You can view bookmarks filtered by album
4. Deleting an album sets bookmarks' album field to null (not deleted)
5. Deleting a user deletes their albums

## Existing Data Migration
If you have existing bookmarks, they will automatically have `album: null`, which means "unassigned". No migration needed - they'll work normally.

## API Functions Available
After setup, these functions are available:
- `createAlbum(userId, name, description)` - Create a new album
- `getAlbums(userId)` - Get all user's albums
- `updateAlbum(albumId, name, description)` - Update album details
- `deleteAlbum(albumId)` - Delete an album
- `moveBookmarkToAlbum(bookmarkId, albumId)` - Move bookmark to album
- `getBookmarkedPosts(userId, albumId)` - Get bookmarks filtered by album
- `toggleBookmark(videoId, userId, albumId)` - Bookmark with album assignment
- `getAlbumBookmarkCounts(userId)` - Get bookmark count per album

## Troubleshooting

### "Collection not found" error
- Verify the collection ID is exactly `albums` (no quotes, lowercase)
- Check that the collection exists in the correct database

### "Attribute not found" error
- Verify all attributes are created correctly
- Check attribute names match exactly (case-sensitive)

### Permission errors
- Verify permissions are set correctly
- Ensure user is authenticated
- Check that document-level permissions include the user's account ID

### Relationship not working
- Verify both collections exist
- Check relationship configuration (Many-to-One, correct related collection)
- Ensure IDs being passed are valid document IDs

## Notes
- The `isDefault` field is reserved for future use (e.g., a system-created "Favorites" album)
- Album names don't need to be unique (users can have multiple albums with same name)
- Bookmarks without an album (`album: null`) are valid and will show in "All Bookmarks" view
- Deleting an album doesn't delete the bookmarks - they become unassigned
