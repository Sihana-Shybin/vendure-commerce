import { Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { ActionBarLocationId } from '../../common/component-registry-types';
import { DataService } from '../../data/providers/data.service';
import { NotificationService } from '../notification/notification.service';

export type NavMenuBadgeType = 'none' | 'info' | 'success' | 'warning' | 'error';

/**
 * @description
 * A color-coded notification badge which will be displayed by the
 * NavMenuItem's icon.
 *
 * @docsCategory nav-menu
 * @docsPage navigation-types
 */
export interface NavMenuBadge {
    type: NavMenuBadgeType;
    /**
     * @description
     * If true, the badge will propagate to the NavMenuItem's
     * parent section, displaying a notification badge next
     * to the section name.
     */
    propagateToSection?: boolean;
}

/**
 * @description
 * A NavMenuItem is a menu item in the main (left-hand side) nav
 * bar.
 *
 * @docsCategory nav-menu
 */
export interface NavMenuItem {
    id: string;
    label: string;
    routerLink: RouterLinkDefinition;
    onClick?: (event: MouseEvent) => void;
    icon?: string;
    /**
     * Control the display of this item based on the user permissions.
     */
    requiresPermission?: string | ((userPermissions: string[]) => boolean);
    statusBadge?: Observable<NavMenuBadge>;
}

/**
 * @description
 * A NavMenuSection is a grouping of links in the main
 * (left-hand side) nav bar.
 *
 * @docsCategory nav-menu
 */
export interface NavMenuSection {
    id: string;
    label: string;
    items: NavMenuItem[];
    icon?: string;
    displayMode?: 'regular' | 'settings';
    /**
     * @description
     * Control the display of this item based on the user permissions.
     */
    requiresPermission?: string | ((userPermissions: string[]) => boolean);
    collapsible?: boolean;
    collapsedByDefault?: boolean;
}

/**
 * @description
 * Providers available to the onClick handler of an {@link ActionBarItem} or {@link NavMenuItem}.
 *
 * @docsCategory action-bar
 */
export interface ActionBarContext {
    route: ActivatedRoute;
    injector: Injector;
    dataService: DataService;
    notificationService: NotificationService;
}

export interface ActionBarButtonState {
    disabled: boolean;
    visible: boolean;
}

/**
 * @description
 * A button in the ActionBar area at the top of one of the list or detail views.
 *
 * @docsCategory action-bar
 */
export interface ActionBarItem {
    id: string;
    label: string;
    locationId: ActionBarLocationId;
    /**
     * @description
     * Deprecated since v2.1.0 - use `buttonState` instead.
     * @deprecated - use `buttonState` instead.
     */
    disabled?: Observable<boolean>;
    /**
     * @description
     * A function which returns an observable of the button state, allowing you to
     * dynamically enable/disable or show/hide the button.
     *
     * @since 2.1.0
     */
    buttonState?: (context: ActionBarContext) => Observable<ActionBarButtonState>;
    onClick?: (event: MouseEvent, context: ActionBarContext) => void;
    routerLink?: RouterLinkDefinition;
    buttonColor?: 'primary' | 'success' | 'warning';
    buttonStyle?: 'solid' | 'outline' | 'link';
    icon?: string;
    requiresPermission?: string | string[];
}

/**
 * @description
 * A function which returns the router link for an {@link ActionBarItem} or {@link NavMenuItem}.
 *
 * @docsCategory action-bar
 */
export type RouterLinkDefinition = ((route: ActivatedRoute, context: ActionBarContext) => any[]) | any[];
