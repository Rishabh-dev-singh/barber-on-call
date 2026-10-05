from rest_framework import permissions

class IsBarberUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with role 'barber'.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "barber"
        )


class IsOwnerBarberProfile(permissions.BasePermission):
    """
    Ensures a barber can only edit their own profile.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user