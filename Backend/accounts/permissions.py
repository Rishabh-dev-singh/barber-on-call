from rest_framework import permissions


class IsCustomerUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with role 'customer'.
    """
    message = "Access Denied: Only verified customer accounts can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "customer"
        )


class IsBarberUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with role 'barber'.
    """
    message = "Access Denied: Only verified barber accounts can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "barber"
        )

